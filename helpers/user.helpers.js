  const db=require('../config/connection')
  const collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('../app')
const { reject } = require('lodash')
const  ObjectId  = require('mongodb').ObjectId
const Razorpay = require('razorpay')
const paypal = require('paypal-rest-sdk');
const { LogContext } = require('twilio/lib/rest/serverless/v1/service/environment/log')

var instance = new Razorpay({ 
  key_id: 'rzp_test_ezIbSE8Fg796E8',
   key_secret: 'XMvZ949JjUtiLYxZDFmyhQGI' 
  })

 


module.exports={
  existingUser:(Email,Phone)=>{
    return new Promise(async(resolve,reject)=>{
      existingUser=await db.get().collection(collection.USER_COLLECTION).find({$or:[{Email:Email},{Phone:Phone}]})
      resolve({existingUser:true})
    })
  },
    doSignup:(userData)=>{
      return new Promise(async(resolve,reject)=>{
        userData.Password=await bcrypt.hash(userData.Password,10)
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
           
            resolve(data.inserted)
           })
      })
     
      
      },


  doLogin:(userData)=>{
      return new Promise(async(resolve,reject)=>{
       let loginStatus=false
       let response={}
       let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
       
       if(user==null||user.status==false){
        console.log('login failure');
        resolve({status:false})
          
          
            }
            else{
              bcrypt.compare(userData.Password,user.Password).then((status)=>{
                if(status==true){
                 
                  console.log('login succes');
                 response.user=user
                 response.status=true
                 resolve(response)
                
                }
                else{
                  console.log('login failed');
                  resolve({status:false})
 
                }
 
                })
               
            }
       
      })
  },


  addToCart:(proId,userId)=>{
    let proObj={
      item:ObjectId(proId),
      quantity:1
    }
     return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
        if(userCart){
          let proExist=userCart.products.findIndex(product=>product.item==proId)
          console.log(proExist);
          if(proExist!=-1){
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({user:ObjectId(userId),'products.item':ObjectId(proId)},
            {
              $inc:{'products.$.quantity':1}
            }).then(()=>{
              resolve()
            })
          }else{
            
         
           db.get().collection(collection.CART_COLLECTION)
           .updateOne({user:ObjectId(userId)},
           {
          
                $push:{products:proObj}  
            
           }).then((response)=>{
            resolve()
           })
          }
        }
        else{
            let cartObj={ 
                user:ObjectId(userId),
                products:[proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(()=>{
                resolve()
            })

        }
      
     })
  },


  getCartproducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cartItems= await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
          $match:{user:ObjectId(userId)}
        },
        {
          $unwind:'$products'
        },
        {
          $project:{
            item:'$products.item',
            quantity:'$products.quantity'
          }
        },
        {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
        },
        {
          $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
          }
        }
       
      ]).toArray()
     
      
      resolve(cartItems)
    })
  },


  getAllUsers:()=>{
    return new Promise(async(resolve,reject)=>{
        let user=db.get().collection(collection.USER_COLLECTION).find().toArray()
        resolve(user)
    })
  },


  unBlockUser:(userId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},
        {
          $set:{
            status:true
          }
        }).then((response)=>{
            resolve(response)
        })
    })
  },


  blockUser:(userId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},
        {
          $set:{
            status:false
          }
        }).then((response)=>{
            resolve(response)
        })
    })
  },


  getUserDetails:(number)=>{
    return new Promise(async(resolve,reject)=>{
     let response={}
      let user=await db.get().collection(collection.USER_COLLECTION).findOne({Phone:number})
      console.log('user:',user);
         response.user=user
      resolve(response)
    })
  },


 getCartCount:(userId)=>{
  let count=0
  return new Promise(async(resolve,reject)=>{
    let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
    if(cart){
      count=cart.products.length
    }
    resolve(count)
  })
 },


 changeProductQuantity:(details)=>{
  console.log('asdfredcxs',details)
   
  details.count=parseInt(details.count)
  details.quantity=parseInt(details.quantity)


  return new Promise((resolve,reject)=>{
    if(details.count==-1 && details.quantity==1){
         db.get().collection(collection.CART_COLLECTION)
         .updateOne({_id:ObjectId(details.cart)},
         {
          $pull:{products:{item:ObjectId(details.product)}}
         }).then((response)=>{
          resolve({removeProduct:true})
         })
    }else{
      db.get().collection(collection.CART_COLLECTION)
      .updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product)},
      {
        $inc:{'products.$.quantity':details.count}
      }).then((response)=>{
        console.log(response);
        resolve({status:true})
      })

    }
  
  })
 },


 getTotalAmount:(userId)=>{
  
  return new Promise(async(resolve,reject)=>{
    let total= await db.get().collection(collection.CART_COLLECTION).aggregate([
      {
        $match:{user:ObjectId(userId)}
      },
      {
        $unwind:'$products'
      },
      {
        $project:{
          item:'$products.item',
          quantity:'$products.quantity'
        }
      },
      {
        $lookup:{
          from:collection.PRODUCT_COLLECTION,
          localField:'item',
          foreignField:'_id',
          as:'product'
        }
      },
      {
        $project:{
          item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
        }
      },
      {
        
         $group:{
          _id:null,
          total:{$sum:{$multiply:['$quantity','$product.Price']}}
         }
      }
     
    ]).toArray()
   
      resolve(total[0]?.total)
  })
 
 },


//  placeOrder:(order,products,total)=>{
//         return new Promise((resolve,reject)=>{
//          let  status=order['payment-method']==='COD'?'placed':'pending'
//          let orderObj={
//            deliverdetails:{
//             mobile:order.mobile,
//             address:order.address,
//             pincode:order.pincode

//            },
//            userId:ObjectId(order.userId),
//            paymentMethod:order['payment-method'],
//            products:products,
//            totalAmount:total,
//            status:status,
//           //  date:new Date().toLocaleString(),
//            date:new Date(),

//            cancel: false,
//          }
//          db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
//           db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)
//           })
          
//           resolve(response.insertedId)
//          })
//         })
//  },



 getProductList:(userId)=>{
  return new Promise(async(resolve,reject)=>{
    let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
     console.log(cart);
    resolve(cart.products)
  })
 },


 getUserOrders:(userId)=>{
  return new Promise(async(resolve,reject)=>{
    let orders=await db.get().collection(collection.ORDER_COLLECTION)
    .find({userId:ObjectId(userId)}).sort({date:-1}).toArray()
    resolve(orders)
    console.log('fdsafdsa',orders);
  })
 },


 addAddress: (address) => {
  address.userId = ObjectId(address.userId);
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ADDRESS_COLLECTION)
      .insertOne(address)
      .then((data) => {
        resolve(data);
      });
  });
},

 getAlladdress: (user) => {
  let userId =user._id;
  return new Promise(async (resolve, reject) => {
    let address = await db
      .get()
      .collection(collection.ADDRESS_COLLECTION)
      .find({ userId:ObjectId(userId) })
      .toArray();
      console.log('qwert',address)
    resolve(address);
  });

 },



 getOneUser: (userId) => {
  return new Promise(async (resolve, reject) => {
    let user = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .findOne({ _id: ObjectId(userId) });
    resolve(user);
  });
},

updateUser: (upUser) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.USER_COLLECTION)
      .updateOne(
        { _id: ObjectId(upUser.id) },
        {
          $set: {
            name: upUser.name,
            mobile: upUser.mobile,
            email: upUser.email,
          },
        }
      )
      .then((response) => {
        resolve();
      });
  });
},


 getOrderProduct:(orderId)=>{
  console.log('chesds',orderId);
  return new Promise(async(resolve,reject)=>{
    let orderItems= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match:{_id:ObjectId(orderId)}
      },
      {
        $unwind:'$products'
      },
      {
        $project:{
          item:'$products.item',
          quantity:'$products.quantity'
        }
      },
      {
        $lookup:{
          from:collection.PRODUCT_COLLECTION,
          localField:'item',
          foreignField:'_id',
          as:'product'
        }
      },
      {
        $project:{
          item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
         
        }
      }
    ]).toArray()
    console.log('rerere',orderItems);
    resolve(orderItems)
  })
 },



 getOneAddress: (addressId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ADDRESS_COLLECTION)
      .findOne({ _id: ObjectId(addressId) })
      .then((addressDetails) => {
        resolve(addressDetails);
      });
  });
},



 

 updateAddress: (upAddress) => {
  upAddress.id = ObjectId(upAddress.id);
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ADDRESS_COLLECTION)
      .updateOne(
        { _id: upAddress.id },
        {
          $set: {
            name: upAddress.name,
            state: upAddress.state,
            city: upAddress.city,
            zip: upAddress.zip,
            mobile: upAddress.mobile,
            email: upAddress.email,
            address: upAddress.address,
          },
        },
        { upsert: true }
      )
      .then((response) => {
        resolve();
      });
  });
},




 deleteAddress: (id) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ADDRESS_COLLECTION)
      .deleteOne({ _id: ObjectId(id) })
      .then((response) => {
        resolve(response);
      });
  });
},





 getUserAddress: (addressid) => {
  return new Promise(async (resolve, reject) => {
    let address = await db
      .get()
      .collection(collection.ADDRESS_COLLECTION)
      .findOne({ _id: ObjectId(addressid) });
    resolve(address);
  });
},


 placeOrder:(order,products,total,address)=>{
 let userId = order.userId;
  console.log('order:',order)
  return new Promise((resolve,reject)=>{
   let  status=order['payment-method']==='COD'?'placed':'pending'
   let orderObj = {
    deliveryDetails: address,
    userId: ObjectId(userId),
    paymentMethod: order["payment-method"],
    products: products,
    totalAmount: total,
    status: status,
    //date: new Date().toLocaleDateString(),
    date:new Date().toLocaleString(),
    //            date:new Date(),

    cancel: false,
  };
  
   db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
    db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(userId)
    })
    
    resolve(response.insertedId)
   })
  })
},

 changeStatus: (status, id) => {
  let newStatus = status;
  return new Promise(async (resolve, reject) => {
    if (newStatus == "cancel") {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              status: false,
              deliveredStatus: false,
              cancelStatus: true,
            },
          },
          {
            upsert: true,
          }
        )
        .then(() => {
          resolve();
        });
    } else if (newStatus == "delivered") {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: ObjectId(id) });
      db.get().collection(collection.DELIVERED_COLLECTION).insertOne(order),
        await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(id) },

            {
              $set: {
                status: false,
                cancelStatus: false,
                dispatchedStatus: false,
                deliveryStatus: true,
              },
            },
            {
              upsert: true,
            }
          )
          .then(() => {
            resolve();
          });
    } else if (newStatus == "proccessing") {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              status: false,
              cancelStatus: false,
              deliveryStatus: false,
              proccessingStatus: true,
            },
          },
          {
            upsert: true,
          }
        )
        .then(() => {
          resolve();
        });
    } else if (newStatus == "dispatched") {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              status: false,
              cancelStatus: false,
              deliveryStatus: false,
              proccessingStatus: false,
              dispatchedStatus: true,
            },
          },
          {
            upsert: true,
          }
        )
        .then(() => {
          resolve();
        });
    } else if (newStatus == "return") {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              status: false,
              cancelStatus: false,
              deliveryStatus: false,
              proccessingStatus: false,
              dispatchedStatus: false,
              returnStatus: true,
            },
          },
          {
            upsert: true,
          }
        )
        .then(() => {
          resolve();
        });
    }
  });
},









//  cancelOrder:(orderId)=>{
//   return new Promise((resolve,reject)=>{
//     db.get().collection(collection.ORDER_COLLECTION)
//     .updateOne({_id:ObjectId(orderId)},
//     {
//       $set:{
//         status:'pending'
//       }
//     })
//     .then(()=>{
//       resolve()
//   })
 
//   })
//  },

 generateRazorpay:(orderId,total)=>{
  return new Promise((resolve,reject)=>{
    instance.orders.create({
      amount:parseInt(total*100),
      currency: "INR",
      receipt:''+orderId
    },(err,order)=>{
      if(err){
        console.log(err);
      }else {
        
        resolve(order)
      }
    
    })
  })
 },



 verifyPayment:(details)=>{
  return new Promise((resolve,reject)=>{
     const crypto=require('crypto')
     let hmac=crypto.createHmac('sha256','XMvZ949JjUtiLYxZDFmyhQGI')
     hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
     hmac=hmac.digest('hex')
     if(hmac==details['payment[razorpay_signature]'])
       {
        resolve()
       }else{
        reject()
       }

  })
 },




 changePaymentStatus: (orderId, userID) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ORDER_COLLECTION)
      .updateOne(
        { _id: ObjectId(orderId) },
        {
          $set: {
            status: "placed",
          },
        }
      )
      .then(() => {
        db.get()
          .collection(collection.CART_COLLECTION)
          .deleteOne({ user: ObjectId(userID) })
          .then(() => {
            resolve();
          });
      });
  });
},


//  changePaymentStatus:(orderId)=>{
//   return new Promise((resolve,reject)=>{
//     db.get().collection(collection.ORDER_COLLECTION)
//     .updateOne({_id:ObjectId(orderId)},
//     {
//       $set:{
//         status:'placed'
//       }
//     }).then(()=>{
//       resolve()
//     })
//   })
//  },













 getsalesReport: () => {
  return new Promise(async (resolve, reject) => {
    let orderItems = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate([
        {
          $match: { deliveryStatus: true },
        },
        {
          $project: {
            orderId: "$orderId",
            userId: "$userId",
            paymentMethod: "$paymentMethod",
            totalAmount: "$totalAmount",
            date: "$date",
            products: "$products",
          },
        },
      ])
      .toArray();
    resolve(orderItems);
  });
},

getweeklyreport: async () => {
  const dayOfYear = (date) =>
    Math.floor(
      (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );
  return new Promise(async (resolve, reject) => {
    const data = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate([
        {
          $match: {
            $and: [
              { status: { $ne: "cancelled" } },
              { status: { $ne: "pending" } },
            ],
            date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
          },
        },

        { $group: { _id: { $dayOfYear: "$date" }, count: { $sum: 1 } } },
      ])
      .toArray();
    const thisday = dayOfYear(new Date());
    let salesOfLastWeekData = [];
    for (let i = 0; i < 8; i++) {
      let count = data.find((d) => d._id === thisday + i - 7);

      if (count) {
        salesOfLastWeekData.push(count.count);
      } else {
        salesOfLastWeekData.push(0);
      }
    }
    resolve(salesOfLastWeekData);
  });
},

getSalesReport: (from, to) => {
  console.log('fromDate:',new Date(from).toLocaleString())
  console.log('toDate:',new Date(to).toLocaleString())
  return new Promise(async (resolve, reject) => {
    let orders = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate([
        {
          $match: {
            $and: [
              { date: { $gte: new Date(from).toLocaleString(), $lte: new Date(to).toLocaleString()} },
              { deliveryStatus: true },
            ],
          },
        },
      ])
      .toArray();
    resolve(orders);
    console.log('order:',orders);
  });
},


getNewSalesReport: (type) => {
  const numberOfDays =
    type === "daily"
      ? 1
      : type === "weekly"
      ? 7
      : type === "monthly"
      ? 30
      : type === "yearly"
      ? 365
      : 0;
  const dayOfYear = (date) =>
    Math.floor(
      (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );
  return new Promise(async (resolve, reject) => {
    const data = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate([
        {
          $match: {
            $and: [
              {
                date: {
                  $gte: new Date(
                    new Date() - numberOfDays * 60 * 60 * 24 * 1000
                  ),
                },
              },
              { deliveryStatus: true },
            ],
          },
        },
      ])
      .toArray();
    resolve(data);
  });
},




 //Password
 changePassword: (data) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.USER_COLLECTION)
      .findOne({ _id: ObjectId(data.userID) })
      .then((user) => {
        bcrypt
          .compare(data.currentpassword, user.password)
          .then(async (status) => {
            if (status) {
              newpassword = await bcrypt.hash(data.password, 10);
              confirmpassword = await bcrypt.hash(data.confirmpassword, 10);
              await db
                .get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                  { _id: ObjectId(data.userID) },
                  {
                    $set: {
                      password: newpassword,
                      confirmpassword: confirmpassword,
                    },
                  }
                );
              resolve({ status: true });
            } else {
              resolve({ status: false });
            }
          });
      });
  });
},


}