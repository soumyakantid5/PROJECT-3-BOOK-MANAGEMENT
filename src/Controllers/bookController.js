const bookModel = require("../Models/bookModel");
const userModel = require("../Models/userModel");
const reviewModel = require("../Models/reviewModel");
const mongoose = require("mongoose");

let isValid = function (value) {
  if (typeof value === "undefined" || typeof value == null) return false
  if (typeof value === "string" && value.trim().length == 0) return false;
  if (typeof value === "number") return false;
  return true;
};

let createBooks = async function (req, res) {
  try {
    let data = req.body;

    let { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = data;

    if (!Object.keys(data).length) {
      return res.status(400).send({ status: false, message: "you must enter data for creating books" });
    }

  

    /////////////////////////////////////////////------CHECK TITLE------//////////////////////////////////
    
    if (!title)
    return res.status(400).send({ status: false, message: "you must give title" });

    if (!isValid(title))
      return res.status(400).send({ status: false, message: "Title should be valid string" });

    let Title = await bookModel.findOne({ title: title });

    if (Title)
      return res.status(400).send({ status: false, message: "This title is already exist" });

    ///////////////////////////////////////////////------CHECK EXCERPT------//////////////////////////////
    
    if (!excerpt)
      return res.status(400).send({ status: false, message: "you must give excerpt of the book" });

   
    if (!isValid(excerpt))
      return res.status(400).send({ status: false, message: "Excerpt should be vali string" });

    if (!excerpt.trim().match(/^[a-zA-Z,\-.\s]*$/))
      return res.status(400).send({ status: false, message: "please enter a excerpt of the book" });

    ////////////////////////////////////////----CHECK USERID----//////////////////////////////////////////
   
    if (!userId)
      return res.status(400).send({ status: false, message: "you must give UserId" });

    if (!isValid(userId))
      return res.status(400).send({ status: false, message: "userId should be valid" });

    if (!mongoose.isValidObjectId(userId))
      return res.status(400).send({ status: false, message: "Invalid user id." });

    let checkUser = await userModel.findById(userId);

    if (!checkUser)
      return res.status(400).send({ status: false, message: "User doesn't exist" });

    //////////////////////////////////----CHECK ISBN----//////////////////////////////////////////////////

    if (!ISBN)
      return res.status(400).send({ status: false, message: "you must give ISBN" });

   
    if (ISBN.trim().length!==13 || !Number(ISBN))
      return res.status(400).send({ status: false, message: "ISBN must contain 13 digits" });

    let checkIsbn = await bookModel.findOne({ ISBN: ISBN });
    if (checkIsbn)
      return res.status(400).send({ status: false, message: "This ISBN is already exists" });

    ////////////////////////////////////////////////////----CHECK CATEGORY----////////////////////////////
   
    if (!category)
      return res.status(400).send({ status: false, message: "please give the category of book" });

    if (!isValid(category))
      return res.status(400).send({ status: false, message: "category should be valid string" });

    if (!category.match(/^[a-zA-Z,\s]*$/))
      return res.status(400).send({ status: false, message: "please enter valid category" });

    ////////////////////////////////////////////////////----CHECK SUBCATEGORY----/////////////////////////

    if (!subcategory)
      return res.status(400).send({ status: false, message: "please give the subcategory of book" });

    if (!isValid(subcategory) || subcategory.length===0 )
      return res.status(400).send({ status: false, message: "subcategory should be valid string" });

    if (Array.isArray(subcategory)) {
      if (!subcategory.join(" ").match(/^[a-zA-Z,\s]*$/) || !subcategory.join("").trim().length){
        return res.status(400).send({ status: false, message: "please enter valid subCategory" });
      }
      else{
      const uniqueSubcat = [...new Set(subcategory)];
      data["subcategory"] = uniqueSubcat;
      }        
    }
    ////////////////////////////////////////////////////----CHECK RELEASEDAT----//////////////////////////

    if (!releasedAt)
      return res.status(400).send({ status: false, message: "releasedAt must be present" });

    if (!releasedAt.trim().match(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/))
      return res.status(400).send({ status: false, message: "please enter valid date" });
   
      ////////////////////////////////////////////////////----CREATE BOOKS----///////////////////////////

      if (data.userId != req.userId)
      return res.status(403).send({status: false, message: "You don't have authority to create this Book."});

    let newBook = await bookModel.create(data);
    res.status(201).send({ status: true, message: "Success", data: newBook });
  } 
  catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

//////////////////////////////////=====GET BOOK API=====/////////////////////////////////////////////////

const getBook = async function (req, res) {
  try {
    let data = req.query;
  
    let filterData = { isDeleted: false };
    const { userId, category, subcategory } = data;

    if (userId) {
      if (!mongoose.isValidObjectId(userId))
        return res.status(400).send({ status: false, message: "Please enter valid userId " });

      let uid = await userModel.findById(userId);

      if (!uid) {
        return res.status(400).send({ status: false, message: "userId doesn't exist" });
      } 
      else {
        filterData.userId = userId;
      }
    }

    if (category) {
      if (isValid(category) && /^[a-zA-Z]{2,20}$/.test(category)) {
        filterData.category = category;
      } 
      else {
        return res.status(400).send({ status: false, message: "Please enter valid category name" });
      }
    }

    if (subcategory) {
      if (isValid(subcategory) && /^[a-zA-Z ]{2,20}$/.test(subcategory)) {
        filterData.subcategory = subcategory;
      } 
      else {
        return res.status(400).send({status: false,message: "Please enter valid subcategory name"});
      }
    }

    let findData = await bookModel.find(filterData).select({title: 1,excerpt: 1,userId: 1,category: 1,
        reviews: 1,releasedAt: 1,}).sort({ title: 1 });

    if (findData.length == 0)
      return res.status(404).send({ status: false, message: "No books found" });
    else {
     return res.status(200).send({ status: true, message: "Books list", data: findData });
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

///////////////////////////////////////GET BOOK BY BOOK ID/////////////////////////////////////////////

const getBookFromBookId = async function (req, res) {
  try {
    let data = req.params.bookId;

    if (!mongoose.isValidObjectId(data)) {
      return res.status(400).send({ status: false, message: "BookId must be valid" });
    }
    const findBook = await bookModel.findOne({ _id: data, isDeleted: false });
    if (!findBook)
      return res.status(404).send({ status: false, message: "Book not found" });

//.........................................................................................
    let reviewedBook = await reviewModel.find({ bookId: data, isDeleted: false })

    if (!reviewedBook.length) {
    reviewedBook = [];
    }

    const result = {findBook};
    result.reviewedBook=reviewedBook


    return res.status(200).send({ status: true, message: "Book lists", data: result });
  } 
  catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

/////////////////////////////////////////UPDATE BOOK//////////////////////////////////////////////

const updateBook = async function (req, res) {
  try {
    let id = req.params.bookId;

    if (!mongoose.isValidObjectId(id))
      return res.status(400).send({ status: false, message: "Please enter valid bookId " });

    let bookData = await bookModel.findOne({ _id: id ,isDeleted:false});
    if (!bookData )
      return res.status(404).send({ status: false, message: "No book found with this bookId " });

    if (bookData.userId.toString() != req.userId)
      return res.status(401).send({status: false, message: "You don't have authority to update this Book."});

    let data = req.body;
    if (!Object.keys(data).length)
      return res.status(400).send({ status: false, message: "Please enter valid parameter " });

    const { title, excerpt, releasedAt, ISBN } = data;

    let filterData = { isDeleted: false };

    if (title) {
      if (isValid(title)) {
        filterData.title = title;
      } 
      else {
        return res.status(400).send({ status: false, message: "Please enter valid book title" });
      }
    }

    if (excerpt) {
      if (isValid(excerpt) && /^[a-zA-Z,\-.\s]*$/.test(excerpt)) {
        filterData.excerpt = excerpt;
      } 
      else {
        return res.status(400).send({ status: false, message: "Please enter valid book excerpt" });
      }
    }

    if (releasedAt) {
      if (isValid(releasedAt) && /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/.test(releasedAt)){
        filterData.releasedAt = releasedAt;
      } 
      else {
        return res.status(400).send({ status: false, message: "Please enter valid released date" });
      }
    }

    if (ISBN) {
      if (isValid(ISBN) && /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/.test(ISBN)) {
        filterData.ISBN = ISBN;
      } 
      else {
        return res.status(400).send({ status: false, message: "Please enter valid book ISBN" });
      }
    }


    let findData = await bookModel.find(filterData);
 
    if (findData.length !== 0)
      return res.status(400).send({ status: false, message: "Data Not Unique" });
    
      let updateData = await bookModel.findOneAndUpdate({ _id: id},{$set: 
        {
            title: data.title,
            excerpt: data.excerpt,
            releasedAt: data.releasedAt,
            ISBN: data.ISBN,
          },
        },{ new: true, upsert: true });
      return res.status(200).send({ status: true, message: "Success", data: updateData });
    
  } 
  catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};





const DeleteBook = async function (req, res) {
  try {
    let bookId = req.params.bookId;

    if (!mongoose.isValidObjectId(bookId)) {
     return res.status(400).send({status: false, message: "Please enter a valid bookId",});
    }

    /******************************Authorization Check*****************************/
    let authCheck = await bookModel.findById(bookId);
    if (!authCheck)
      return res.status(404).send({ status: false, message: "No Document found." });

    if (authCheck.userId != req.userId)
      return res.status(403).send({status: false, message: "You don't have authority to delete this Book."});

    /*********************************************************************************/
    let deleteBook = await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false },
                                  { $set: { isDeleted: true, deletedAt: new Date() } } );

    if (!deleteBook) {
      return res.status(404).send({ status: false, message: "No book Found or already deleted" });
    }
     else {
      return res.status(200).send({ status: true, message: "deleted successfully" });
    }
  } 
  catch (error) {
    res.status(500).send({ msg: error.message });
  } 
};

module.exports = {createBooks,getBook,getBookFromBookId,updateBook,DeleteBook};

