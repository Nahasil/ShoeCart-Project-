var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const async = require("hbs/lib/async");
const { reject } = require("bcrypt/promises");
var objectId = require("mongodb").ObjectID;
const { ObjectId } = require("mongodb");
const { response } = require("express");

module.exports = {
  displayCategoryOffer: async () => {
    let offers = await db
      .get()
      .collection(collection.CATEGORY_OFFER_COLLECTION)
      .find()
      .toArray();
    return offers;
  },

  //add category offer

  addCategoryOffer: async(categoryOfferDetails) => {
    
        

        let categoryOffer = {
            category: categoryOfferDetails.category,
            offer: parseInt(categoryOfferDetails.offer),
            createdAt: new Date(),
           // expiry: new Date(categoryOfferDetails.expiry),
          };
          return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_OFFER_COLLECTION).insertOne(categoryOffer).then(async (data) => {
                let category = categoryOffer.category;
                let offer = categoryOfferDetails.offer;

                let proCategory = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:categoryOfferDetails.category})
                prodCategoryId=proCategory._id
                 console.log('ASDFR',prodCategoryId);


                let Data = await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:ObjectId(prodCategoryId)}).toArray()
                  console.log("qwert",Data);
                await Data.map(async (product) => {
                    console.log('!@#$%',product);
                  let productPrice = product.Price;
                  let OfferPrice = productPrice - (productPrice * offer) / 100;
                  OfferPrice = parseInt(OfferPrice);
                  let proId = product._id + "";
                  await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id: ObjectId(proId)},
                      {
                        $set: {
                          Price: OfferPrice,
                          categoryoffer: true,
                          OldPrice: productPrice,
                          bestoffer: parseInt(offer),
                          offerPercentage: parseInt(offer),
                        },
                      }
                    );
                  resolve();
                });
              });
          });

   
  },
  //delete category offer
  deleteCategoryOffer: (offId,category) => {
    console.log('12345678',offId);
    console.log(category);
    return new Promise(async (resolve, reject) => {
      let items = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { Category:ObjectId(category), categoryoffer: true },
          },
        ])
        .toArray();
        console.log("@#$#@",items);
      await items.map(async (product) => {
        let productPrice = product.OldPrice;
        let proId = product._id + "";

        await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: ObjectId(proId) },
            {
              $set: {
                Price: productPrice,
                categoryoffer: false,
                offerPercentage: null,
                OldPrice: null,
              },
            }
          );
      });
      db.get()
        .collection(collection.CATEGORY_OFFER_COLLECTION)
        .deleteOne({ _id: ObjectId(offId) })
        .then(async () => {
          resolve();
        });
    });
  },



  categoryId:(category)=>{
    return new Promise(async(resolve,reject)=>{
      let categories=await db.get().collection(collection.CATEGORY_COLLECTION).find({Category:category}).toArray()
      console.log(categories)
      resolve(categories[0]?._id)
    })
  },

};
