const express = require('express');
const router = express.Router();
const productHelpers=require('../helpers/product.helpers')
const userHelpers=require('../helpers/user.helpers')
const banerHelpers = require("../helpers/baner.helpers");
const couponHelpers = require("../helpers/coupon.helpers")
const offerHelpers=require('../helpers/offerHelpers')
const categoryOfferHelpers=require('../helpers/category-offer-helpers')
require('dotenv').config()

  
const { response } = require('../app');
const serviceSID =process.env.serviceSID
const accountSID =process.env.accountSID
const authToken =process.env.authToken
const Client=require('twilio')(accountSID,authToken)

const paypal = require("paypal-rest-sdk");
const { category } = require('../helpers/product.helpers');


/*paypal.configure({
  'mode': 'sandbox', //sandbox or live
  client_id: 'ATQVBMuOkiqNLU0bVMSwcOzamYJGvFwFavcJd9r7p2Z3CWTLhbN3HgRXJUQET-56afU7YVLrsCctNHxM',
  client_secret: 'EBy-8m7kdZSfhDfq_G3D2dIFT8Lkg5kE8uo4BipVN-Xnu4eQNDOAPS9skPyB2i3nvvELwbKOrzDlWxiK'
});*/



paypal.configure({
  'mode': 'sandbox', //sandbox or live
  client_id:process.env.client_id,
  client_secret: process.env.client_secret

})




let verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
   
    next()
  }
  else{
  
    res.render('user/login',{loginErr: req.session.userloginErr})
    req.session.userloginErr=false
  }
}


/* GET user page. */ 
router.get('/',verifyLogin,async function(req, res, next) {
  let user=req.session.user
  req.session.userLoggedIn=true
  productHelpers.getAllProduct().then(async(products)=>{
let Baner = await banerHelpers.getallbaners();
     let Category=await productHelpers.category()
    let cartCount= await userHelpers.getCartCount(user._id)
    res.render('user/view-products', {products,user,cartCount,Category,Baner});
   }).catch((err)=>{
    console.log('error:',err)
    res.render('error')
  })
});



router.get('/login',(req,res)=>{
 if(req.session.userLoggedIn){
 res.redirect('/')
 }else{
  res.render('user/login',{loginErr:req.session.userLoginErr})
  req.session.userLoginErr=false
 }
})



router.post("/login",(req,res)=>{
  if(req.body.Email==null||req.body.Password===null||req.body.Email==''||req.body.Password===''){
    req.session.userLoginErr='Please Enter Email or Password'
    res.redirect('/login')
  }
  else{

    userHelpers.doLogin(req.body).then((response)=>{ 
      if(response.status==true){
      req.session.user=response.user
      req.session.userLoggedIn=true
      res.redirect('/') 
      }
      else{
             req.session.userLoginErr='Invalid Email or Password'
              res.redirect('/login')
           }
       }).catch((err)=>{
        console.log('error:',err)
        res.render('error')
      })
  }
 
})




router.get('/signup',(req,res)=>{
  res.render('user/signup',{signupErr:req.session.userSignupErr})
})



router.post('/signup',async(req,res)=>{
  userExist=await userHelpers.existingUser(req.body.Email,req.body.Phone)
  console.log(userExist);
  if(userExist==true){
    req.session.userSignupErr='Already Existing Email or Phone Number'
    res.redirect('/signup')
}
else{
  userHelpers.doSignup(req.body).then((response)=>{
    res.redirect('/login')
  }).catch((err)=>{
    console.log('error:',err)
    res.render('error')
  })
}
})






router.get('/otp-login',(req,res)=>{
  res.render('user/login-mobile',{NumberErr:req.session.NumberErr})
})



router.post('/otp-login',(req,res)=>{
const number=req.body.Number
  if(number==null||number==''){
    req.session.NumberErr='Please Enter Number'
    res.redirect('/otp-login')
}else{
  console.log('qwert')
  userHelpers.getUserDetails(number).then((response)=>{
   
   
    if(response.user==null)
    {
      req.session.NumberErr='This Number is not Exist'
     res.redirect('/otp-login')
    }
    else if(response.user.status==true){
      console.log('utytutytu',number+"  service:",serviceSID);
      req.session.phone=response.user.Phone
      Client.verify
      .services(serviceSID)
      .verifications.create({
        to:`+91${number}`,
        channel:'sms'
    }).then((resp)=>{
     console.log('hlo');
      res.render('user/otp-login')
     }).catch((err)=>{
      console.log('error:',err)
      res.render('error')
     })
    }else if(response.user.status==false){
      req.session.NumberErr='You are blocked'
      res.redirect('/otp-login')
    }
    
  
  }).catch((err)=>{
    console.log('error:',err)
    res.render('error')
  })
}
})




router.get('/login-OTP',(req,res)=>{
  
  if(req.session.userLoggedIn){
    
    res.redirect('/')
  }else{
    console.log('else taken');
  res.render('user/otp-login',{otpErr:req.session.OTPErr})
  }
})





router.post('/login-OTP',(req,res)=>{
const phone=req.session.phone
userHelpers.getUserDetails(phone).then((response)=>{
  req.session.user=response.user
  const otp=req.body.OTP
  Client.verify
  .services(serviceSID)
  .verificationChecks.create({
    to:`+91${phone}`,
    code:otp
  })
  .then((resp)=>{
    if(resp.valid){
      req.session.userLoggedIn=true
      res.redirect('/')
    }else{
      req.session.OTPErr='Incorrect OTP'
      res.redirect('/login-OTP')
    }
  }).catch((err)=>{
    console.log('error:',err)
    res.render('error')
  })
}).catch((err)=>{
  console.log('error:',err)
  res.render('error')
})

})



router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false
  res.render('user/login',{loginErr:req.session.userLoginErr})
  req.session.userLoginErr=false
})

router.get('/product',verifyLogin,(req,res)=>{
  proId=req.query.id
  let user=req.session.user
  productHelpers.getProductdetails(proId).then(async(product)=>{
    let cartCount= await userHelpers.getCartCount(user._id)
    res.render('user/product', {product,user,cartCount});
  }).catch((err)=>{
    console.log('error:',err)
    res.render('error')
  })
})


router.get('/category',verifyLogin,async(req,res)=>{
  catId=req.query.id
  let user=req.session.user
  
  productHelpers.getCategoryProducts(catId).then(async(products)=>{
    let cartCount= await userHelpers.getCartCount(user._id)
    let Category=await productHelpers.category()
    
    res.render('user/view-category-product', {products,user,cartCount,Category});
  }).catch((err)=>{
    console.log('error:',err)
    res.render('error')
  })

})




router.get('/cart',verifyLogin,async(req,res)=>{
 console.log(req.session.user._id); 
 let cartCount= await userHelpers.getCartCount(req.session.user._id)
 if(cartCount<=0){
  res.redirect('/')
 }else{
  let Category=await productHelpers.category()
  let products=await userHelpers.getCartproducts(req.session.user._id)
  let totalAmount=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/cart',{Category,products,user:req.session.user,cartCount,totalAmount})
}

})


router.get('/add-to-cart/:id',(req,res)=>{
  console.log('call ...');
userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
  res.json({status:true})
  })
})


router.post('/change-product-quantity',(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    console.log("@#$@#$%##@",req.body.user);
    response.total=await userHelpers.getTotalAmount(req.body.user)
     res.json(response)
  })
})


router.get('/place-order',verifyLogin,async(req,res)=>{
  let user = req.session.user;
  console.log(user)
 let userDetails = await userHelpers.getOneUser(user._id);
  let cartCount=0
  let Category=await productHelpers.category()
  cartCount = await userHelpers.getCartCount(user._id);
  await userHelpers.getAlladdress(user).then(async(address) => {
    userHelpers.getTotalAmount(user._id).then((total) => {
      if (userDetails.couponamount) {
        var grandTotal = total - (userDetails.couponamount * total) / 100;
      } else {
        grandTotal = total;
      }
      let discount = userDetails.couponamount;
      
      res.render("user/place-order", { user, grandTotal, address,total, cartCount,Category,discount,
      });
    });

  })
 })



router.post('/place-order',async(req,res)=>{
  
  let userAddress = await userHelpers.getUserAddress(req.body.addressid);
  let products=await userHelpers.getProductList(req.body.userId)
  let total=await userHelpers.getTotalAmount(req.body.userId)
  

  let discount = null;
  
  let user = await userHelpers.getOneUser(req.body.userId);
  if (user.couponamount) {
    discount = user.couponamount;
    total = total - (discount * total) / 100;
  }


  req.session.totalAmount=total
  userHelpers.placeOrder(req.body,products,total,userAddress).then((orderId)=>{
   req.session.orderId=orderId
    if(req.body['payment-method']=='COD'){
      res.json({codSuccess:true})
    }
    else if(req.body['payment-method']=='Paypal'){
     
      req.session.orderId = orderId;
      const create_payment_json = {
        intent: "sale",
        payer: {
            payment_method: "paypal"
        },
        redirect_urls: {
            return_url: "http://localhost:8000/success",
            cancel_url: "http://localhost:8000/cancel"
        },
        transactions: [{
            item_list: {
                items: [{
                    name:orderId,
                    sku: "001",
                    price:total,
                    currency: "USD",
                    quantity: 1
                }]
            },
            amount: {
                currency: "USD",
                total: total
            },
            description: "Order from Shoecart"
        }]
    };
  
  
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.log(error)
          throw error;
      } else {
          for(let i = 0;i < payment.links.length;i++){
            if(payment.links[i].rel === 'approval_url'){
              res.json({paypal:true,val:payment.links[i].href});
            }
          }
      }
    });

   

    }

     else{
      userHelpers.generateRazorpay(orderId,total).then((response)=>{
         res.json(response)
         console.log('hlo:',response);
      }).catch((err)=>{
        console.log('error:',err)
        res.render('error')
      })
     }
  })
  
})

router.get("/success", (req, res) => {
  let total = req.session.totalAmount;
  let user = req.session.user._id;
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: total,
        },
      },
    ],
  };
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        throw error;
      } else {
        userHelpers.changePaymentStatus(req.session.orderId, user).then(() => {
          res.redirect("/order-success");
        }).catch((err)=>{
          console.log('error:',err)
          res.render('error')
        })
      }
    }
  );
});







router.get('/order-success',verifyLogin,(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})




router.get('/orders',verifyLogin,async(req,res)=>{
 let cartCount=0
  cartCount = await userHelpers.getCartCount(req.session.user._id);
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  let Category=await productHelpers.category()
  

  res.render('user/orders',{user:req.session.user,orders,cartCount,Category})
  console.log(orders);
})

router.get("/status-change", (req, res) => {
  let status = req.query.status;
  let id = req.query.id;
  userHelpers.changeStatus(status, id).then((data) => {
    res.redirect("/orders");
  });
});


router.get('/view-order',verifyLogin,async(req,res)=>{
  console.log('ggshdhfAD',req.query.id);
  let product=await userHelpers.getOrderProduct(req.query.id)
  let Category=await productHelpers.category()
  res.render('user/view-orders',{user:req.session.user,product,Category})
  console.log('12345');

})






router.get('/cart-delete-product/',verifyLogin,(req,res)=>{
proId=req.query.id
userId=req.session.user._id
productHelpers.deleteCartProduct(proId,userId).then((response)=>{
  console.log(response);
  res.redirect('/cart')
     })
  })





router.post('/verify-payment',(req,res)=>{
  console.log('ddfff',req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
       userHelpers.changePaymentStatus(req.body['order[receipt]'],req.session.user._id).then(()=>{
        res.json({status:true})
       })
  }).catch((err)=>{
    res.json({status:false})
  })
})





// ===========================================================USER PROFILE SECTION=================================================================
// ------------------------------------------------------------------Addresss----------------------------------------------------------------------

//Get profile address
router.get("/profile-address",verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(user._id);

  }
  let Category=await productHelpers.category()
  await userHelpers.getAlladdress(user).then((address) => {
    res.render("user/profile-address", {user,address,cartCount,Category});
  });
});

//Get add profile address
router.get("/add-profile-address",verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let Category=await productHelpers.category()
  res.render("user/add-profile-address", { user,Category, cartCount});
});

//Post add profile address
router.post("/add-profile-address",verifyLogin, (req, res) => {
  req.body.userId = req.session.user._id;
  userHelpers.addAddress(req.body).then((response) => {
    res.redirect("/profile-address");
  });
});

//Get edit profile address
router.get("/edit-profile-address/:id",verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let Category=await productHelpers.category()
  await userHelpers.getOneAddress(req.params.id).then((addressDetails) => {
    if (req.session.user._id != addressDetails.userId) {
      res.render("user/error_user_not_accessible", {sign: true});
    }
    res.render("user/edit-profile-address", {Category,user,addressDetails,cartCount});
  });
});

//Post edit profile address
router.post("/edit-profile-address",verifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.updateAddress(req.body).then(() => {
    res.redirect("/profile-address");
  });
});

//Get delete profile address
router.get("/delete-profile-address/:id",verifyLogin, (req, res) => {
  userHelpers.deleteAddress(req.params.id).then((response) => {
    res.redirect("/profile-address");
  });
})








//-------------------------------------------------------------------Address----------------------------------------------------------------------\\

//GET address
router.get("/address",verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let Category=await productHelpers.category()
  
 
  res.render("user/address", {user,cartCount,Category});
});

//post address
router.post("/address",verifyLogin, (req, res) => {
  req.body.userId = req.session.user._id;
  userHelpers.addAddress(req.body).then((response) => {
    res.redirect("/place-order");
  });
});

//GET edit address
router.get("/edit-address/:id",verifyLogin, async (req, res) => {
  let cartCount = null;

  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
 
  }
  let Category=await productHelpers.category()
  let user = req.session.user;
  await userHelpers.getOneAddress(req.params.id).then((addressDetails) => {
    if (req.session.user._id != addressDetails.userId) {
      res.render("user/error_user_not_accessible", {
        sign: true,
        noheader: true,
      });
    }
    res.render("user/edit-address", {
      user,
      addressDetails,
      cartCount,
      Category
    });
  });
});

//POST edit address
router.post("/edit-address",verifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.updateAddress(req.body).then(() => {
    res.redirect("/place-order");
  });
});

//Get delete address
router.get("/delete-address/:id",verifyLogin, (req, res) => {
  userHelpers.deleteAddress(req.params.id).then((response) => {
    res.redirect("/place-order");
  });
});





// ------------------------------------------------------------------Addresss----------------------------------------------------------------------

//Get user profile
router.get("/user-profile",verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  await userHelpers.getOneUser(req.session.user._id).then((user) => {
    res.render("user/user-profile", { user, cartCount });
  });
});

//GET edit user profile details
router.get("/edit-profile-details/:id",verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  if (req.session.user._id != req.params.id) {
    res.render("user/error_user_not_accessible", {
      sign: true,
      noheader: true,
    });
  }
  userHelpers.getOneUser(req.params.id).then((user) => {
    res.render("user/edit-profile-details", { user, cartCount});
  });
});

//Post edit user profile details
router.post("/edit-profile-details",verifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.updateUser(req.body).then(() => {
    res.redirect("/user-profile");
  });
});






// ------------------------------------------------------------------Password----------------------------------------------------------------------

//Get change password
router.get("/change-password",verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  
  if (req.query.valid) {
    var passwordError = req.query.valid;
  }
  res.render("user/change-password", {
    user,
    passwordError,
    cartCount
  });
});

//Post change password
router.post("/change-password", (req, res) => {
  userHelpers.changePassword(req.body).then((response) => {
    if (response.status) {
      req.session.user = null;
      req.session.loggedIn = false;
      res.redirect("/login");
    } else {
      var string = encodeURIComponent("Enter the correct password");
      res.redirect("/change-password?valid=" + string);
    }
  });
});




// ------------------------------------------------------------------Coupon----------------------------------------------------------------------

//Get apply coupon
router.get("/applyCoupon", verifyLogin, (req, res) => {
  let userId = req.session.user._id;
  console.log('aswqaswqa',req.query.coupon);
  couponHelpers.checkCoupon(req.query.coupon, userId).then((response) => {
    res.json(response);
  });
});

// ------------------------------------------------------------------offers----------------------------------------------------------------------

//Get offers
router.get("/offers", verifyLogin, async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
 
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  
  }
  let Category=await productHelpers.category()
  let coupon = await couponHelpers.displayCoupon();
  let productOffer = await offerHelpers.GetAllProductOffers();
  let categoryOffer = await categoryOfferHelpers.displayCategoryOffer();
  
  res.render("user/offers", {
    coupon,
    user,
    categoryOffer,
    productOffer,
    cartCount,
    Category
   
  });
});




module.exports  = router;
