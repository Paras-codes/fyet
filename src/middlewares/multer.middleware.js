import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")//returns the destination 
    },//read
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)//return the file name 
    }
  })
  
export const upload = multer({ 
    storage, 
})