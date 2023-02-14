const mongoose = require('mongoose')
const Book = require('./book')

const authorsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

authorsSchema.pre("remove", function (next) {
  Book.find({ author: this.id }, (err, books) => {
    if (err) {
      next(err)
    } else if (books.length > 0) {
      next(new Error("Cannot delete author with books"))
    } else {
      next()
    }
  })
})

module.exports = mongoose.model('Author', authorsSchema)