const express = require('express');
//const { getAllProduct } = require('../helpers/product.helpers');
const router = express.Router();
const productHelpers=require('../helpers/product.helpers')
const userHelpers=require('../helpers/user.helpers')
const couponHelpers = require("../helpers/coupon.helpers");
const adminHelpers = require("../helpers/admin.helpers");
const banerHelpers = require("../helpers/baner.helpers");
const categoryOfferHelpers=require("../helpers/category-offer-helpers")
const offerHelpers=require('../helpers/offerHelpers')
//const upload=require('../middleware/upload')
//const homeController = require("../controllers/home");
//const uploadController = require("../controllers/upload");


const verifyAdminLogin=(req,res,next)=>{
  if(req.session.admin)
  {
    
    next()
  }
  else{
    
    res.render('admin/login',{admin:true,loginErr:req.session.loginErr})
    req.session.loginErr=false
  }
}

/* GET  admin page. */

router.get('/',verifyAdminLogin,async(req, res, next)=> {
  let admin=req.session.admin
orders=await adminHelpers.orderCount()
products=await adminHelpers.productCount()
users=await adminHelpers.userCount()
cash=await adminHelpers.cashPayment()
razor=await adminHelpers.razorPayment()
paypal=await adminHelpers.paypalPayment()
console.log('hlo:',cash);
  
res.render('admin/admin-page',{admin,admin:true,logAdmin:true,users,products,orders,cash,razor,paypal})
  
  
  
});
router.get('/view-products',verifyAdminLogin,(req,res)=>{
  productHelpers.getAllProduct().then((products)=>{
    console.log(products);
    res.render('admin/view-products',{admin:true,products})
  })
 
})

router.get('/add-product',verifyAdminLogin,async(req,res)=>{
let categories=await productHelpers.getAllCategories()

  res.render('admin/add-product',{admin:true,categories})
})

router.post('/add-product',(req,res)=>{

  productHelpers.addProduct(req.body).then((id)=>{
    let image=req.files?.image1
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.redirect('/admin/view-products')
      }else{
        console.log(err);
      }
    })
    
  })

  
})
const admin={
  email:process.env.email,
  password:process.env.password
}
router.get('/adminLogin',(req,res)=>{
  if(req.session.admin){
   
    res.redirect('/admin/')
   }else{
    res.render('admin/login',{adminErr:req.session.adminLoginErr,admin:true})
    req.session.adminLoginErr=false
   }
})
router.post('/adminLogin',(req,res)=>{
  if(req.body.Email===admin.email && req.body.Password===admin.password)
  {
    
    req.session.admin=true
    res.redirect('/admin')
  }else{
  console.log('hsgahdgs');
    req.session.adminLoginErr='Invalid Email or Password'
    res.redirect('/admin/adminLogin')
   
    
  }

})
router.get('/adminlogout',(req,res)=>{
  req.session.admin=false    
  res.redirect('/admin')
})
router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId)
  console.log(req.query.name);
  productHelpers.deleteproduct(proId).then((response)=>{
   
    res.redirect('/admin/view-products')
   
  })
})


router.get('/edit-product/:id',verifyAdminLogin,async(req,res)=>{
  let product=await productHelpers.getProductdetails(req.params.id)
 
  res.render('admin/edit-product',{admin:true,product})
})


router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
  productHelpers.updateProduct(id,req.body).then(()=>{
    res.redirect('/admin/view-products')
    if(req.files.Image){
      let image=req.files?.Image
      image.mv('./public/product-images/'+id+'.jpg')
    }
  })
})





// --------------------------------------------------baner----------------------------------------------------

// GET baner
router.get("/baners",verifyAdminLogin, function (req, res) {
  banerHelpers.getallbaners().then((baner) => {
    res.render("admin/baners", {admin:true, baner });
  });
});

// GET add baner
router.get("/add-baner",verifyAdminLogin, function (req, res) {
  res.render("admin/add-baner", { admin: true });
});

// POST add baner
router.post("/add-baner",async (req, res) => {
  baners=await banerHelpers.getallbaners()
  banerHelpers.addBaner(req.body, (id) => {
    let image = req.files?.image;
    image.mv("./public/baner-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/baners",{admin:true,baners});
      } else {
        console.log(err);
      }
    });
    res.render("admin/baners",{baners,admin:true});
  });
});

// GET edit baner
router.get("/edit-baner/:id",verifyAdminLogin, async (req,res) => {
  let Baner = await banerHelpers.getBanerDetails(req.params.id);
  res.render("admin/edit-baner", { Baner, admin: true });
});

// POST edit baner
router.post("/edit-baner/:id", (req, res) => {
  let id = req.params.id;
  banerHelpers.updateBaner(req.params.id, req.body).then(() => {
    res.redirect("/admin/baners");
    if (req.files?.image) {
      let image = req.files?.image;
      image.mv("./public/baner-images/" + id + ".jpg");
    }
  });
});





router.get('/view-user',verifyAdminLogin,(req,res)=>{
  userHelpers.getAllUsers().then((user)=>{
  
    res.render('admin/view-users',{admin:true,user})
  })
  
})



router.get('/block-user',(req,res)=>{
  let userId=req.query.id

userHelpers.blockUser(userId).then((response)=>{
  console.log(response);
  res.redirect('/admin/view-user')
   })
})
router.get('/unblock-user',(req,res)=>{
  let userId=req.query.id

userHelpers.unBlockUser(userId).then((response)=>{
 
  res.redirect('/admin/view-user')
  })
})


router.get('/view-categories',verifyAdminLogin,(req,res)=>{
  productHelpers.getAllCategories().then((categories)=>{
    res.render('admin/view-categories',{categories,admin:true})
  })
 
})

router.get('/add-category',verifyAdminLogin,(req,res)=>{

  res.render('admin/add-category',{admin:true})

})

router.post('/add-category',(req,res)=>{
  productHelpers.addCategory(req.body).then(()=>{

    res.redirect('/admin/view-categories')

  })
  
})



router.get('/view-orders',verifyAdminLogin,async(req,res)=>{
 
    
     orders=await productHelpers.getOrders()
    res.render('admin/view-orders',{admin:true,orders})
})

router.get("/status-change",verifyAdminLogin, (req, res) => {
  let status = req.query.status;
  console.log(status)
  let id = req.query.id;
  userHelpers.changeStatus(status, id).then((data) => {
    res.redirect("/admin/view-orders");
  });
});

// router.get('/cancel-orders',(req,res)=>{
//   let orderId=req.query.id
//   userHelpers.cancelOrder(orderId).then(()=>{
//     res.redirect('/admin/view-orders')
//   })
// })






// ----------------------------------------------Product Offers------------------------------------------------

//Get add Product Offers
router.get('/add-product-offer/:id',verifyAdminLogin,(req,res)=>{
  let ProdId=req.params.id
      res.render('admin/add-product-offer',{admin:true,ProdId})
  })
  router.post('/add-product-offer',(req,res)=>{
   
    offerHelpers.AddProductOffers(req.body).then((response)=>{
        res.redirect('/admin/view-products')
    })
   
})
//Get Product Offers
router.get('/admin-product-Offer',verifyAdminLogin,async(req,res)=>{

  var ProductOffer=await  offerHelpers.GetAllProductOffers()
  console.log('09876',ProductOffer)
    res.render('admin/admin-product-Offer',{admin:true,ProductOffer})

})

//Post remove Product Offers
router.post('/RemoveProductOffer',(req,res)=>{
  OfferID=req.query.offerId
  ProdID=req.query.ProdId
offerHelpers.RemoveProductOffer(OfferID,ProdID).then((response)=>{
    res.redirect('/admin-product-Offer')
})
})






// ----------------------------------------------Category Offer------------------------------------------------

//get Category Offer
router.get("/category-offer",verifyAdminLogin, async (req, res) => {
  let categoryOffer=await categoryOfferHelpers.displayCategoryOffer();
  res.render("admin/category-offer", { admin: true ,categoryOffer});
});

//get add Category Offer
router.get("/add-category-offer",verifyAdminLogin, function (req, res) {
  productHelpers.getAllCategories().then((allCategory) => {
  res.render("admin/add-category-offer", { admin: true , allCategory});
});
});

//Post add Category Offer
router.post("/add-category-offer", (req, res) => {
  categoryOfferHelpers.addCategoryOffer(req.body).then((response) => {
    res.redirect("/admin/category-offer");
  });
});



//get delete Category Offer
router.get("/delete-category-offer/", async (req, res) => {
  console.log('hlo', req.query.id,req.query.cat);
  let categoryOfferId = req.query.id;

 category=await categoryOfferHelpers.categoryId(req.query.cat)
 console.log('zxcv',category);
  categoryOfferHelpers.deleteCategoryOffer(categoryOfferId,category).then((response) => {
    res.redirect("/admin/category-offer");
  });
});





// --------------------------------------------------Coupon----------------------------------------------------

//get coupon
router.get("/coupons",verifyAdminLogin, async (req, res) => {
  let coupons = await couponHelpers.displayCoupon();
  res.render("admin/admin-coupon", { admin: true, coupons });
});

//get add coupon
router.get("/add-coupons",verifyAdminLogin, function (req, res) {
  res.render("admin/add-coupons", { admin: true });
});

//post add coupon
router.post("/add-coupons", (req, res) => {
  couponHelpers.addCoupon(req.body).then((response) => {
    res.redirect("/admin/coupons");
  });
});

//delete coupon
router.get("/delete-coupon/:id", (req, res) => {
  let couponId = req.params.id;
  couponHelpers.deleteCoupon(couponId).then((response) => {
    res.redirect("/admin/coupons");
  });
});





// ------------------------------------------------Sales report------------------------------------------------

//Get Sales report
router.get("/salesreport", verifyAdminLogin, async (req, res) => {
  let salesreport = await userHelpers.getsalesReport();
  res.render("admin/salesreport", { admin: true, salesreport });
});

//Post Sales report
router.post("/salesreport/report", async (req, res) => {
  let salesReport = await userHelpers.getSalesReport(
    req.body.from,
    req.body.to
  );
  res.json({ report: salesReport });
});
router.post("/salesreport/monthlyreport", async (req, res) => {
  let singleReport = await userHelpers.getNewSalesReport(req.body.type);
  res.json({ wmyreport: singleReport });
});
// ------------------------------------------------Sales report------------------------------------------------





module.exports = router;