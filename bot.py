import logging
import asyncio
import hashlib
import json

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext

import httpx


logging.basicConfig(level=logging.INFO)
TOKEN = 'YOUR_BOT_TOKEN'
WEB_APP_URL = "YOUR_WEB_APP_URL"  #Замените на ваш URL веб-приложения

bot = Bot(token=TOKEN)
dp = Dispatcher()


# States (FSM)
class RegistrationState(StatesGroup):
    NAME = State()
    PIN = State()
    CONFIRM_PIN = State()

class AuthState(StatesGroup):
    PIN = State()


# Open web app for register or login
async def open_web_app(message, is_registration_required=True):
    user_id = message.from_user.id

    try:
        async with httpx.AsyncClient() as client:
            url = "http://localhost:8000/"  # бэкэнд
            res = await client.post(url, json={"method": "get_data", "user_id": user_id})

        data = res.json()

        markup = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="Перейти к приложению",
                        web_app=types.WebAppInfo(url=WEB_APP_URL),
                    )
                ]
            ]
        )
        await message.answer("Перехожу в приложение", reply_markup=markup)

        # if this is a register page load info and make webapp recognize it
        if is_registration_required and not data["user"]:
            await bot.answer_web_app_query(
                message.id,
                json.dumps(
                    {
                        "isRegistration": True,
                        "message": "Добро пожаловать! Заполните форму для региcтрации!",
                    }
                ),
            )

        # This part sends necessary user login data + load initial dashboard screen data

        elif is_registration_required and data["user"]:
            await bot.answer_web_app_query(
                message.id,
                json.dumps(
                    {
                        "isRegistration": False,
                        "message": "Ваши данные успешно получены",
                        "name": data["user"]["name"],
                    }
                ),
            )

        # same but if we already authorized send initial main screen info
        elif not is_registration_required and data["user"]:
            await bot.answer_web_app_query(
                message.id,
                json.dumps(
                    {
                        "isRegistration": False,
                        "message": "Введите пин код для входа!",
                        "name": data["user"]["name"],
                    }
                ),
            )

        elif is_registration_required == False and not data["user"]:
            await message.answer("Вы не зарегистрированы!")
            await bot.answer_web_app_query(
                message.id,
                json.dumps(
                    {
                        "isRegistration": True,
                        "message": "Заполните форму регистрации",
                    }
                ),
            )

    except Exception as e:
        logging.error(e)


# Start of message handling
@dp.message(Command("start"))
async def command_start(message: types.Message):
    await open_web_app(message)


# Получения сообщений от web app  (регистрация и аутентификация )
@dp.message()
async def process_web_app_messages(message: types.Message, state: FSMContext):
    try:
        data = json.loads(message.web_app_data.data)

        #   register event start
        if "base_connect" in data:
            await message.answer("Базовое соединение прошло успешно")

        if data["register"] == True:
            if "name" in data:
                name = data["name"]

                await state.update_data(name=name)

                await message.answer("Введите пинкод(4 цифры)")
                await state.set_state(RegistrationState.PIN)

        # AUTHENTICATION SECTION START HERE
        elif "auth" in data and data["auth"] == True:
            if "pin" in data:
                pin = data["pin"]
                user_id = message.from_user.id

                async with httpx.AsyncClient() as client:
                    url = "http://localhost:8000/"  # бэкэнд
                    res = await client.post(
                        url, json={"method": "login", "user_id": user_id, "pin": pin}
                    )
                    login_data = res.json()
                if "error" in login_data:
                    await message.answer(login_data["error"])
                    await open_web_app(message, is_registration_required=False)
                    return

                if "login" in login_data and login_data["login"] == "Success":
                    await message.answer("Аутентификация прошла успешно!")
                    await open_web_app(message, is_registration_required=False)

                else:
                    await message.answer(
                        "Аутентификация не пройдена, попробуйте еще раз"
                    )

    except Exception as e:
        logging.error(f"process_web_app_messages {e}")


# Second step (save PIN) and open main_menu
@dp.message(RegistrationState.PIN)
async def get_pin_register(message: types.Message, state: FSMContext):
    try:
        pin = message.text

        if not pin.isdigit() or len(pin) != 4:
            await message.answer("Пин код должен состоять из 4 чисел")
            return

        await state.update_data(pin=pin)
        await message.answer("Подтвердите пинкод!")
        await state.set_state(RegistrationState.CONFIRM_PIN)

    except Exception as e:
        logging.error("error in registration pin code %s", e)


# Подтверждение pin и создание юзера
@dp.message(RegistrationState.CONFIRM_PIN)
async def confirm_pin(message: types.Message, state: FSMContext):
    try:
        user_data = await state.get_data()
        pin_from_state = user_data["pin"]
        pin_from_message = message.text

        if (
            not pin_from_message.isdigit()
            or len(pin_from_message) != 4
            or pin_from_message != pin_from_state
        ):
            await message.answer("Неверный пин-код")

            return
        user_name = user_data["name"]
        user_pin_hashed = hashlib.sha256(pin_from_state.encode()).hexdigest()
        user_id = message.from_user.id

        async with httpx.AsyncClient() as client:
            url = "http://localhost:8000/"  # бэкэнд
            res = await client.post(
                url,
                json={"method": "register", "name": user_name, "pin": user_pin_hashed},
            )
            reg_response_data = res.json()

        if "error" in reg_response_data:
            await message.answer(reg_response_data["error"])

        if "message" in reg_response_data and reg_response_data["message"] == "user Created!":
            await state.clear()
            await message.answer("Регистрация прошла успешно")
            await open_web_app(message)
    except Exception as e:
        logging.error(f"Error in confirm registration step: {e}")


async def main():
    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())