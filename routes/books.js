const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Book = require('../models/book')
const uploadPath = path.join('public', Book.coverImageBasePath)
const Author = require('../models/authors')
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']
const upload = multer({ 
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype))
    }
})


router.get('/', async (req, res) => {
    let query = Book.find()
    if (req.query.title != null && req.query.title != '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }
    if (req.query.publishedBefore != null && req.query.publishedBefore != '') {
        query = query.lte('publishedDate', req.query.publishedBefore)
    }
    if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
        query = query.gte('publishedDate', req.query.publishedAfter)
    }
    try{
       const books = await query.exec()
       res.render('books/index', { 
        books: books,
        searchOptions: req.query
    })  
    } catch{
        res.redirect('/')
    }
    
})

//new book
router.get('/new', async (req, res) => {
    renderNewPage(res, new Book)
})

//create new book
router.post('/', upload.single('Cover'), async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishedDate: new Date(req.body.publishedDate),
        pageCount: req.body.pageCount,
        coverImageName: fileName,
        description: req.body.description
    })

    try {
        const newBook = await book.save()
        res.redirect('/books')
    } catch {
       if (book.coverImageName!= null) {
         removeBookCover(book.coverImageName)
       }
        renderNewPage(res, book, true)
    }
})

function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (err) => {
    if (err) console.error(err)
  })
}

async function renderNewPage(res, book, hasError = false) {
    try {
        const authors = await Author.find({})
        const params = {
            authors: authors,
            book: book
        }
        if (hasError) params.errorMessage = 'error creating book'
        res.render('books/new', params)
    } catch{
        res.redirect('/books')
    }
}

module.exports = router