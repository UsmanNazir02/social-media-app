const { findUser, createUser, updateUser } = require("../models/userModel");
const { compare, hash } = require('bcrypt');
const { generateRefreshToken, generateToken, generateResponse, asyncHandler, parseBody, generateRandomOTP, generateResetToken } = require("../utils");
const { loginUserValidation, registerUserValidation, sendCodeValidation, resetPasswordValidation, codeValidation, refreshTokenValidation } = require("../validations/authValidations");
const { STATUS_CODES, ROLES } = require("../utils/constants");
const { deleteOTPs, addOTP, getOTP } = require("../models/otpModel");
const { sendEmail } = require("../utils/mailer");


exports.register = asyncHandler(async (req, res, next) => {
    console.log('register');
    try {
        const body = parseBody(req.body);

        // Joi validation
        const { error } = registerUserValidation.validate(body);
        if (error) return next({
            statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
            message: error.details[0].message
        });

        const userWithEmail = await findUser({ email: body.email });
        if (userWithEmail) return next({
            statusCode: STATUS_CODES.CONFLICT,
            message: 'Email already exists'
        });

        // hash password
        const hashedPassword = await hash(body.password, 10);
        body.password = hashedPassword;
        body.role = "user";

        // create user in db
        // create user and set role as user
        let user = await createUser(body);

        // generate access token and refresh token
        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        console.log("AccessToken>>>>", accessToken);
        req.session.accessToken = accessToken;

        // update user with refreshToken
        user = await updateUser({ _id: user._id }, { $set: { refreshToken } });
        generateResponse({ user, accessToken, refreshToken }, 'Register successful', res);

    } catch (e) {
        console.log(e);
    }
});

exports.login = asyncHandler(async (req, res, next) => {
    try {
        const body = parseBody(req.body);

        // Joi validation
        const { error } = loginUserValidation.validate(body)
        if (error) return next({
            statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
            message: error.details[0].message
        });

        let user = await findUser({ email: body?.email }).select('+password');
        if (!user) return next({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: 'Email not found'
        });

        // checking password match
        const isMatch = await compare(body.password, user.password);
        if (!isMatch) return next({
            statusCode: STATUS_CODES.UNAUTHORIZED,
            message: 'Invalid password'
        });

        const accessToken = generateToken(user)
        const refreshToken = generateRefreshToken(user)

        req.session.accessToken = accessToken;

        // update user fcmToken
        user = await updateUser({ _id: user._id }, { $set: { refreshToken } });
        generateResponse({ user, accessToken, refreshToken }, 'Login Successful', res);
    } catch (e) {
        console.log(e);
    }
});

exports.logout = asyncHandler(async (req, res, next) => {
    const fcmToken = req.body.fcmToken;
    req.session = null;
    generateResponse(null, 'Logout successful', res);
});


exports.sendVerificationCode = asyncHandler(async (req, res, next) => {
    const body = parseBody(req.body);

    // Joi Validation
    const { error } = sendCodeValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    const { email } = body;


    const user = await findUser({ email, role: ROLES.USER }).select('email');
    if (!user) return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: 'Invalid Information, Record Not Found!'
    });

    // Delete all previous OTPs
    await deleteOTPs({ email });

    const otpObj = await addOTP({
        email: user.email,
        otp: generateRandomOTP(),
    });

    generateResponse({ code: otpObj.otp }, 'Verification Code is Generated Successfully', res);

    // sendEmail({ email, subject: 'Verification Code', message: `Your OTP Code is ${otpObj.otp}` })
    //     .then(() => console.log("Email sent successfully"))
    //     .catch(err => console.error("Email sending failed: ", err));
});


exports.verifyCode = asyncHandler(async (req, res, next) => {
    const body = parseBody(req.body);

    //Joi Validation
    const { error } = codeValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    const otpObj = await getOTP({ otp: body.code })
    if (!otpObj) return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: 'Invalid OTP'
    })

    if (otpObj.isExpired()) return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: 'OTP expired'
    });

    const user = await findUser({ email: otpObj.email });
    // throw error if user not found via email
    if (!user) return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: 'User not found'
    });

    const accessToken = generateResetToken(user);
    generateResponse({ accessToken }, 'Code is verified successfully', res);
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
    const userId = req.user.id
    const body = parseBody(req.body);

    // Joi validation
    const { error } = resetPasswordValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    const hashedPassword = await hash(body.newPassword, 10);
    const user = await updateUser({ _id: userId }, { $set: { password: hashedPassword } });
    generateResponse(user, 'Password reset successfully', res);
});


// get refresh token
exports.getRefreshToken = asyncHandler(async (req, res, next) => {
    const body = parseBody(req.body);

    // Joi validation
    const { error } = refreshTokenValidation.validate(body);
    if (error) return next({
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message
    });

    const user = await findUser({ refreshToken: body.refreshToken }).select('+refreshToken');
    if (!user) return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: 'Invalid refresh token'
    });

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    req.session.accessToken = accessToken;

    // update refresh token in db
    await updateUser({ _id: user._id }, { $set: { refreshToken } });
    generateResponse({ accessToken, refreshToken }, 'Token refreshed', res);
});