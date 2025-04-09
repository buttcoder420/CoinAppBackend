const JWT = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();
const nodemailer = require("nodemailer");
// JWT Middleware
var { expressjwt: jwt } = require("express-jwt");
const { ComparePassword, HashPassword } = require("../Helper/UserHelper");
const UserRegisterModel = require("../Models/UserRegisterModel");

const requireSign = [
  jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
  }),
  (err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
      return res.status(401).json({ message: "Invalid or missing token" });
    }
    next();
  },
];
const IsAdmin = async (req, res, next) => {
  try {
    const user = await UserRegisterModel.findById(req.auth._id);
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied! Admin only." });
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};
// Nodemailer transporter setup
/*const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS, // Your Gmail App Password
  },
});

// Function to send verification email
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `https://coin-tube-backend-el9n.onrender.com/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Click the link below to verify your email:</p>
           <a href="${verificationUrl}">Verify Email</a>`,
  };

  await transporter.sendMail(mailOptions);
};
*/
// Function to generate a unique referral code
const generateReferralCode = async () => {
  let isUnique = false;
  let referralCode;

  while (!isUnique) {
    referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const existingUser = await UserModel.findOne({ referralCode });
    if (!existingUser) isUnique = true;
  }

  return referralCode;
};

// Generate referral link dynamically
const generateReferralLink = (referralCode) => {
  const baseUrl =
    process.env.BASE_URL ||
    "https://coin-tube-backend-el9n.onrender.com/api/v1";
  return `${baseUrl}/register?ref=${referralCode}`;
};

// **Login Controller**
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await UserRegisterModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is verified
    /*if (!user.isVerified) {
      return res.status(403).send({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }*/

    // Check password
    const match = await ComparePassword(password, user.password);
    if (!match) {
      return res.status(401).send({
        success: false,
        message: "Invalid password",
      });
    }

    // Create token
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).send({
      success: true,
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

// **Register Controller**
// **Register Controller**
const registerController = async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await UserRegisterModel.findOne({ email });
    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    // Hash password
    const hashedPassword = await HashPassword(password);

    // Generate referral code and link for the new user
    const newReferralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const referralLink = `https://coinappbackend.onrender.com/login?referralCode=${newReferralCode}`;

    // Register new user
    const userRegister = new UserRegisterModel({
      name,
      email,
      phone,
      password: hashedPassword,
      referralCode: newReferralCode,
      referralLink,
    });

    // Handle referral logic
    if (referralCode) {
      const referringUser = await UserRegisterModel.findOne({ referralCode });

      if (referringUser) {
        // Add coins and amount to the new user (referred user)
        userRegister.coin = (userRegister.coin || 0) + 1000; // Add 1000 coins
        userRegister.amount = (userRegister.amount || 0) + 1; // Add 1 USD

        // Add coins and amount to the referring user
        referringUser.coin = (referringUser.coin || 0) + 500; // Add 500 coins
        referringUser.amount = (referringUser.amount || 0) + 0.3; // Add 0.3 USD
        referringUser.totalReferred = (referringUser.totalReferred || 0) + 1;

        // Save the updated referring user's data
        await referringUser.save();

        // Mark the new user as referred by the referring user
        userRegister.referredBy = referralCode;
      }
    }

    // Save the new user
    await userRegister.save();

    res.status(201).send({
      success: true,
      message: "User registered successfully. Please login.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in registration",
      error,
    });
  }
};

/*const verifyEmailController = async (req, res) => {
  try {
    const { token } = req.query;

    // Find user by token
    const user = await UserRegisterModel.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Verify user and remove token
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).send({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error verifying email",
      error,
    });
  }
};*/

const getUserBalance = async (req, res) => {
  try {
    const userId = req.auth?._id; // ✅ Ensure correct authentication middleware is passing user data

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user ID found" });
    }

    const user = await UserRegisterModel.findById(userId, "coin amount");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      coin: user.coin,
      amount: user.amount,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    // Fetching only the required fields
    const users = await UserRegisterModel.find(
      {},
      "name email phone coin role"
    );

    // Respond with the total number of users and their details
    res.status(200).json({
      success: true,
      TotalUser: users.length, // Counting the number of users
      users, // Sending the users data
    });
  } catch (error) {
    // Handling errors and sending a response
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error, // Displaying specific error message
    });
  }
};

// Get Single User
const getUserById = async (req, res) => {
  try {
    const user = await UserRegisterModel.findById(
      req.params.id,
      "name email phone role"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const updatedUser = await UserRegisterModel.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, role, coin, amount },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await UserRegisterModel.findByIdAndDelete(
      req.params.id
    );
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

const convertAmountToCoins = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const user = await UserRegisterModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.amount < amount) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient balance" });
    }

    // Conversion logic: 1 USD = 1000 coins
    const convertedCoins = amount * 1000;

    // Deduct amount and add coins
    user.amount -= amount;
    user.coin = (user.coin || 0) + convertedCoins;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Amount successfully converted to coins",
      coinsAdded: convertedCoins,
      remainingBalance: user.amount,
      totalCoins: user.coin,
    });
  } catch (error) {
    console.error("Error in conversion:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  requireSign,
  IsAdmin,
  loginController,
  registerController,
  getUserBalance,
  //verifyEmailController,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  convertAmountToCoins,
};
