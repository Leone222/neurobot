const tg = window.Telegram.WebApp;
const mainApp = document.getElementById("main_app");
const registrationContainer = document.getElementById("registration_container");
const loginContainer = document.getElementById("login_container");
const usernameField = document.getElementById("username_field");
const regButton = document.getElementById("reg_button");
const loginPinField = document.getElementById("login_pin");
const authButton = document.getElementById("auth_button");
const messageBlock = document.getElementById("message_block");
const headerElement = document.getElementById("header");
const navTabs = document.querySelectorAll(".nav-tab");
const dashboardBlock = document.getElementById("dashboard_block");
const userBalanceString = document.getElementById('user_balance_string')
const balanceCurrenciesContainer  = document.getElementById('balance_currencies')
 const userSelectCurrency  = document.getElementById('user_select_currency');
 const settingsBlock   =   document.getElementById('settings_block')

const currencyList = document.getElementById("currency-list");

const userOrderList  = document.getElementById("user_order_list");
    const currencySelect   = document.getElementById("currency-select");

const changeUsernameField  =   document.getElementById('change_username_field');

const updatePinButton   = document.getElementById("update_pin_button");
const update_user_button = document.getElementById("update_user_button")
 function updateDashboard(){

          if ( mainApp.style.display=="flex"  &&  tg.initDataUnsafe  &&   tg.initDataUnsafe.user){
           fetch("http://localhost:8000", {
         method: "POST",
         headers: {
         "Content-Type": "application/json",
         },
            body: JSON.stringify({ method: 'get_data',  user_id:tg.initDataUnsafe.user.id  }),
          })
           .then(res =>{return   res.json() })
        .then(response  =>  {


       if (response.currencies) {
               currencyList.innerHTML = '';
                response.currencies.forEach(currency => {
                    const card = document.createElement('div');
                    card.classList.add('card', 'currency-pair-card')
                    card.innerHTML =
                         `
                                <span><b>${currency.name}</b></span>

                                    <span><b>${currency.price}</b></span>
                                     <div> <button class ="main-button add_currency" type ="button"    data-currency-id="${currency.id}" data-crypto-name="${currency.name}">
                                Пополнить
                               </button>
                        <button   class ="main-button sell_currency" type="button"  data-currency-id ="${currency.id}" data-crypto-name = "${currency.name}"   >  Продать </button> </div>


                         `;
                currencyList.appendChild(card)


         });

                  document.querySelectorAll('.sell_currency').forEach(function(el){

                   el.addEventListener('click',function(){

                          let currencyId  =   this.dataset.currencyId
                       let name =    this.dataset.cryptoName

                        showOrderWindow('sell', currencyId,name )
                         } )
                   });

           document.querySelectorAll('.add_currency').forEach(function(el){

                  el.addEventListener('click', function(){

                          let currencyId  =   this.dataset.currencyId
                       let name =  this.dataset.cryptoName
                        showOrderWindow("deposit",currencyId,name );
                    })
          });

    }

            if(response.orders) {
                    userOrderList.innerHTML = '';

            response.orders.forEach(order => {
                        const card = document.createElement('div')
                           card.classList.add("card" ,"order-tab");
                          card.innerHTML  =   `
                             <span><b> Тип:${order.type}</b><br>
                           Цена:${order.price}</span><br>
                         <span><b>  Количество : ${order.amount}</b>

                        </span>
                  ${  order.status == 'pending'  ?   `<button data-order-id=${order.id} type='button'    class ="main-button cancel_order_button">Cancel Order</button> ` : `<span> Завершёна</span>`   }
                         `
                userOrderList.appendChild(card)

    })
               document.querySelectorAll(".cancel_order_button").forEach(function(item){

                   item.addEventListener("click",  function(){

                     let order_id  =  this.dataset.orderId

                       fetch("http://localhost:8000", {
                           method: "POST",
                            headers: {
                           "Content-Type": "application/json",

                      },
                         body: JSON.stringify({"method" : "cancel_order"  ,  "order_id": order_id   ,    "user_id" : tg.initDataUnsafe.user.id   })
                               }).then( (data)=>{return  data.json()}).then( data =>{


                      if(data['status'] && data['status']=='Success'){
                        updateDashboard()
                         }

                             });


                   });
      })


            }



if (response.user) {

  if(response.user.name) {

    headerElement.innerHTML = `Добро Пожаловать, ${response.user.name}`

         }

   if(response.user.selected_currency){

        }
 }


     if(response.balances){

       balanceCurrenciesContainer.innerHTML =  ""
            userSelectCurrency.innerHTML = ""
        userBalanceString.innerHTML = 'Общий баланс'
             response.balances.forEach(function (item) {

         let el =  document.createElement("span");

        el.innerText  =   `${item.crypto_id} :  ${item.amount}`;


         let selectElement =  document.createElement('option');


          selectElement.text  =  item.crypto_id
               selectElement.value = item.crypto_id;


           balanceCurrenciesContainer.appendChild(el)

     userSelectCurrency.appendChild(selectElement)
  });
             if( response.user   && response.user.selected_currency){
               userSelectCurrency.value   =   response.user.selected_currency

           }


  }


   });
          }

 }
  function showOrderWindow(order_type, currencyId, name) {

 const modal = document.createElement("div");

     modal.classList.add('container');

        modal.innerHTML = `
           <h2>${ order_type =="deposit" ? "Пополнение":"Размещение ордера"}</h2>

                  <div class = "input-group"    >
                       ${  order_type == 'deposit' ?  '<span>Укажите сумму пополнения</span>'   : ' <span>Укажите желаемую стоимость  за ед. товара</span> ' }


                          ${  order_type =="deposit" ?   `
                 <input   type="text" placeholder = "Сумма пополнения"    id = "order_modal_amount"  type ="text"/>`

               :`  <input    id ="order_modal_price"     type="text" placeholder ="цена"/> <input    id ="order_modal_amount"     type="text" placeholder ="Количество" /> `
                       }
             </div>
  <div  style =" margin-bottom:20px" >
  Криптовалюта :${name}
             </div>
                  <button    type = "button"   class = "main-button submit_modal_button"  >

         Разместить ордер

      </button>
       <button    class = "main-button  close_modal_button"    type="button">Закрыть окно </button>

             `

    mainApp.appendChild(modal);


   const closeModalButton =   document.querySelector(".close_modal_button")
 const orderModalButton   = document.querySelector(".submit_modal_button");

        orderModalButton.addEventListener('click', () => {

            const orderModalPrice    = document.querySelector("#order_modal_price");

            const orderModalAmount = document.querySelector('#order_modal_amount')
            if ( order_type  =='sell' && ( orderModalAmount.value ===  '' ||  orderModalPrice.value ==''  )) {
                         alert("Заполните пожалуйста  все поля");
                           return;
                        }

            if( order_type  =='deposit'   &&   orderModalAmount.value == '' ) {
                        alert("Укажите пожалуйста  сумму  ");

                             return;

                               }



                   fetch("http://localhost:8000/", {

                    method: "POST",

              headers: {
                                  "Content-Type": "application/json",

                           },
                      body: JSON.stringify({"method" :  'create_order' ,
                          'price':   orderModalPrice  ? orderModalPrice.value :  '0',  'crypto_id' : currencyId, "user_id" :  tg.initDataUnsafe.user.id   ,  "order_type": order_type    ,  'amount' : orderModalAmount.value}  ) ,

             })

              .then(data =>{return data.json()  }    ).then(data =>{


              if ( data['status']  &&  data["status"] == "success"){
                             alert(   'Запрос был успешно сформирован'  );

                            updateDashboard();

             mainApp.removeChild(modal);

                   }  else{

             alert("что-то  пошло не  так ")

                          }

                       })
              })


  closeModalButton.addEventListener('click',() =>{
  mainApp.removeChild(modal);

 })


  }
    if (!tg.initData) {
   tg.sendData(JSON.stringify({ base_connect: true }));
  }


  tg.ready();

  tg.MainButton.setText("Назад");
  tg.MainButton.onClick(() => tg.close());


   if (navTabs && navTabs.length > 0) {
      navTabs.forEach(function (navTab) {

       navTab.addEventListener('click', function (e) {
         navTabs.forEach(function (tab) {
              tab.classList.remove('active');

              });

         e.target.classList.add('active');


        document.querySelectorAll('[data-section]').forEach(function (section) {


      if (section.dataset.section == e.target.dataset.tab) {

     section.style.display = 'block';


                } else {
            section.style.display = 'none';

               }

          });

    });


});
 }


      window.onload =   ()=>{
           mainApp.style.display = "none";
           loginContainer.style.display = "none";
           registrationContainer.style.display ="none";



      if(tg.initData ){


         const jsonParse = JSON.parse(tg.initData);
              if (jsonParse && jsonParse["message"]) {

               messageBlock.innerHTML = jsonParse.message;
                  }

       if (jsonParse && jsonParse.name){
                       headerElement.innerHTML = `Добро Пожаловать, ${jsonParse.name}`;
        }
       if (jsonParse &&  jsonParse.isRegistration === false) {


                      loginContainer.style.display = "flex";
                       registrationContainer.style.display = "none";
                         mainApp.style.display= "none"

          }
     if (jsonParse  &&  jsonParse.isRegistration === true ) {
                     loginContainer.style.display = "none";

                           registrationContainer.style.display = "flex";

                 mainApp.style.display = "none"

            }


     if (jsonParse  &&  !jsonParse.isRegistration){

                       loginContainer.style.display = 'flex';
                registrationContainer.style.display ="none";
                        mainApp.style.display = "none"
                      }
           if (jsonParse && !jsonParse.isRegistration && jsonParse.name  && jsonParse["message"] =="Успешный вход" ) {

                       mainApp.style.display = "flex"
                         loginContainer.style.display = 'none';

                        registrationContainer.style.display= "none";


                   updateDashboard()


          }


}


   regButton.addEventListener("click", () => {
          const name = usernameField.value;
                   tg.sendData(JSON.stringify({ register: true, name: name }));

        });

   authButton.addEventListener("click", () => {
          const pin = loginPinField.value;
         tg.sendData(JSON.stringify({ auth: true, pin: pin }));

    });


    }
     currencySelect.addEventListener('change', (e) =>{
  if(  mainApp.style.display == "flex"){
          fetch("http://localhost:8000/", {

               method: "POST",
                  headers: {
                                  "Content-Type": "application/json",

                  },
                         body: JSON.stringify({"method": "update_user_currency"  ,     "user_id"  :tg.initDataUnsafe.user.id    ,  'code':    e.target.value }  )

                      }).then(  data =>{ return  data.json() }).then( data =>{


                          if ( data['status']  &&  data['status'] == 'Success') {

                                  updateDashboard();
                        }
                       })

             }



})


       update_user_button.addEventListener("click", () => {
        if(  mainApp.style.display  =="flex"   &&  tg.initDataUnsafe   &&  tg.initDataUnsafe.user  ){

            let   username   = changeUsernameField.value;
       fetch("http://localhost:8000/", {
      method: "POST",

         headers: {

                 "Content-Type": "application/json",

            },
             body: JSON.stringify({    "method":  "update_user",    "user_id"  :tg.initDataUnsafe.user.id,    "name": username    }   )
                    }).then(data=>{ return data.json()  } ).then ( data =>{

                        if (data['status']    &&  data["status"] == "Success"  ){
                 updateDashboard()
                    }

           })
}

        })



  updatePinButton.addEventListener("click",  async function(){

                   loginContainer.style.display ="flex";
                       registrationContainer.style.display  ="none"
                        mainApp.style.display  ="none"

                   loginPinField.focus();


   })


   setInterval( ()=> {
             if (mainApp.style.display == "flex"    &&  tg.initDataUnsafe    &&   tg.initDataUnsafe.user ){
                     updateDashboard();
                       }

  } ,  5000  )
