const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
    mongoose.connect(process.env.MONGODB_URL, {
        usenewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("DB connected successfully"))
    .catch((error) => {
        console.log("DB coonection failed");
        console.error(error);
        process.exit(1);
    })
};