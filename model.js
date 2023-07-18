const mongoose = require("mongoose");

// Define the UserSchema
const UserSchema = mongoose.Schema({
    email: String,
    googleId: String,
});

// Create the User model
const User = mongoose.model("User", UserSchema);

// Export the User model
module.exports = User;
