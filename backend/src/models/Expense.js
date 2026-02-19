const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: (v) => parseFloat(v.toString()) > 0,
        message: 'Amount must be positive',
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        if (ret.amount && ret.amount.constructor.name === 'Decimal128') {
          ret.amount = ret.amount.toString();
        }
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Expense', expenseSchema);