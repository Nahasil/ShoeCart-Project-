const db=require('../config/connection')
const collection=require('../config/collections')
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
}