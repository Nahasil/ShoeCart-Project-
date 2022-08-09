  const db=require('../config/connection')
  const collection=require('../config/collections')
const { response } = require('../app')
const { reject } = require('lodash')
const  ObjectId  = require('mongodb').ObjectId
  module.exports={
    category:()=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((response)=>{
          
          resolve(response)
        })
      })
     
    },

    addProduct:(product)=>{
       category=product.Category
        product.Price=parseInt(product.Price)
      async(resolve,reject)=>{
      let proCategory = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:category})
    if (proCategory===null){
      product.Category=proCategory._id

      let result =await  db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product)
       console.log(result);
           resolve(result.insertedId)
         
 

    }
  }
    
    },
    getAllProduct:()=>{
      return new Promise(async(resolve,reject)=>{
        let product=await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
          {
            $lookup:{
                          from:collection.CATEGORY_COLLECTION,
                          localField:'Category',
                          foreignField:'_id',
                          as:'Category'
                        }

            },
            {
              $unwind:'$Category'
            }

        
      ]).toArray()
      console.log('qwer',product)
        resolve(product)
      })
    },
    deleteproduct:(pro)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:ObjectId(pro)}).then((response)=>{
          resolve(response)
        })
      })
    },
    getProductdetails:(proId)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)}).then((response)=>{
          resolve(response)
        })
      })
    },
    updateProduct:(proId,proDetails)=>{
      price=parseInt(proDetails.Price)
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION)
        .updateOne({_id:ObjectId(proId)},{
          $set:{
            Name:proDetails.Name,
            Description:proDetails.Description,
            Price:price,
            Category:proDetails.Category
          }
        }).then((response)=>{
             resolve()
        })
      })
    },
    addCategory:(category)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((response)=>{
          resolve(response)
        })
      })

    },
    getAllCategories:()=>{
      return new Promise(async(resolve,reject)=>{
        let categories=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
        resolve(categories)
      })
    },
    deleteCartProduct:(proId,userId)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.CART_COLLECTION)
        .updateOne({user:ObjectId(userId)},
        {
          $pull:{products:{item:ObjectId(proId)}}
        },false,true).then(()=>{
          resolve({remove:true})
        })
      })
    },


     getOrders:()=>{
  return new Promise (async(resolve,reject)=>{
  let   order=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
     resolve(order)

  })
},
  

getCategoryProducts:(catId)=>{
  
  return new Promise (async(resolve,reject)=>{
    let product=await  db.get().collection(collection.PRODUCT_COLLECTION).find({Category:ObjectId(catId)}).toArray()
    console.log('cdfvbg',product)
    if(product){
      resolve(product)
    }
      else{
        reject()
      }

    
  })
},

//      getOrders:()=>{
//   return new Promise(async(resolve,reject)=>{
//      order=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
//         {
//           $lookup:{
//             from:collection.USER_COLLECTION,
//             localField:'userId',
//             foreignField:'_id',
//             as:'user'
//           }
//         },
//         {
          
//             $project:{
//               date:1,deliverdetails:1,paymentMethod:1,totalAmount:1,status:1,user:{$arrayElemAt:['$user',0]}

//             }
          
//         }
//       ]).toArray()
//        resolve(order)
//       })
// }
   
}