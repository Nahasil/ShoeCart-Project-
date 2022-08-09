const db=require('../config/connection')
const collection=require('../config/collections')
const async = require('hbs/lib/async')
const  ObjectId  = require('mongodb').ObjectId

module.exports={
    orderCount:()=>{
        return new Promise(async(resolve,reject)=>{
          orders=await db.get().collection(collection.ORDER_COLLECTION).find().count()  
          resolve(orders)
        })
    },
    userCount:()=>{
        return new Promise(async(resolve,reject)=>{
          users=await db.get().collection(collection.USER_COLLECTION).find().count()  
            resolve(users)
        })
    },
    productCount:()=>{
        return new Promise(async(resolve,reject)=>{
          products=await db.get().collection(collection.PRODUCT_COLLECTION).find().count()  
            resolve(products)
        })
    },


   



    razorPayment:()=>{
      return new Promise(
        async(resolve,reject)=>{
         let razor=await db.get().collection(collection.ORDER_COLLECTION).aggregate([ 
            
              {
                $match:{paymentMethod:'Razorpay'}
              },
           
            { 
            $group: { 
              _id: null,  
                total: { 
                    $sum: "$totalAmount" 
                } 
            } 
        },
        {
          $project:{
            total:1
          }
        }
       ]).toArray()
        console.log('Razor:',razor)
        resolve(razor[0].total)
        }
      )
      
    },
    paypalPayment:()=>{
      return new Promise(
        async(resolve,reject)=>{
         let paypal=await db.get().collection(collection.ORDER_COLLECTION).aggregate([ 
            
              {
                $match:{paymentMethod:'Paypal'}
              },
           
            { 
            $group: { 
              _id: null,  
                total: { 
                    $sum: "$totalAmount" 
                } 
            } 
        },
        {
          $project:{
            total:1
          }
        }
       ]).toArray()
        console.log('Paypal:',paypal)
        resolve(paypal[0].total)
        }
      )
      
    },  
    cashPayment:()=>{
      return new Promise(
        async(resolve,reject)=>{
        let  cash=await db.get().collection(collection.ORDER_COLLECTION).aggregate([ 
            
              {
                $match:{paymentMethod:'COD'}
              },
           
            { 
            $group: { 
              _id: null,  
                total: { 
                    $sum: "$totalAmount" 
                } 
            } 
        },
        {
          $project:{
            total:1
          }
        }
       ]).toArray()
        console.log('cash:',cash[0].total)
        resolve(cash[0]?.total)
        })
      
    },
}