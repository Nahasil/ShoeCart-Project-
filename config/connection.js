const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=(done)=>{
    
    const dbname='shoecart'
    imgBucket:'photos'


    mongoClient.connect(process.env.mongo_uri,(err,data)=>{
         if(err)  return done(err)
         state.db=data.db(dbname)
         done()
    })
    
}


module.exports.get=function(){
    return state.db
}