
const Joi = require('joi');
const { ROLES } = require('../utils/constants');
exports.loginUserValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(30).required(),
});

exports.registerUserValidation = Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().regex(/^[a-zA-Z\s]+[0-9\s]*$/).min(1).max(30).required().messages({
        "string.pattern.base": "First name is not valid.",
        "string.min": "First name must be at least {#limit} characters long.",
        "string.max": "First name must be at most {#limit} characters long.",
        "any.required": "First name is required.",
    }),
    lastName: Joi.string().regex(/^[a-zA-Z\s]+[0-9\s]*$/).min(1).max(30).required().messages({
        "string.pattern.base": "Last name is not valid.",
        "string.min": "Last name must be at least {#limit} characters long.",
        "string.max": "Last name must be at most {#limit} characters long.",
        "any.required": "Last name is required.",
    }),
    username: Joi.string().min(1).max(20).required(),
    password: Joi.string().min(8).max(30).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        'any.only': 'Confirm password does not match with password.',
        'any.required': 'Confirm password is required.',
    }),
    role: Joi.string().valid(...Object.values(ROLES))
});

exports.sendCodeValidation = Joi.object({
    email: Joi.string().email({ minDomainSegments: 2 }).required(),
})

exports.codeValidation = Joi.object({
    code: Joi.string().min(6).max(6).required(),
});

// reset password validation
exports.resetPasswordValidation = Joi.object({
    newPassword: Joi.string().min(8).max(30).required(),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
        'any.only': 'Confirm password does not match with new password.',
        'any.required': 'Confirm password is required.',
    })
});

// refresh token validation
exports.refreshTokenValidation = Joi.object({
    refreshToken: Joi.string().required(),
});