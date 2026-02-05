const mongoose = require('mongoose');

const mockUser = {
    _id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    password: '$2a$10$abcdefghijklmnopqrstuv', // hashed password
    fullName: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    notificationChannels: ['EMAIL'],
    createdAt: new Date()
};

const mockUserWithoutId = {
    email: 'newuser@example.com',
    password: 'password123',
    fullName: 'New User',
    avatar: 'https://example.com/new-avatar.jpg'
};

const validRegistrationData = {
    email: 'newuser@example.com',
    password: 'SecurePass123',
    fullName: 'John Doe',
    avatar: 'https://example.com/avatar.jpg'
};

const validLoginData = {
    email: 'test@example.com',
    password: 'password123'
};

const invalidEmailData = {
    email: 'invalid-email',
    password: 'password123',
    fullName: 'Test User'
};

const shortPasswordData = {
    email: 'test@example.com',
    password: 'short',
    fullName: 'Test User'
};

const missingFieldsData = {
    email: 'test@example.com'
    // missing password and fullName
};

module.exports = {
    mockUser,
    mockUserWithoutId,
    validRegistrationData,
    validLoginData,
    invalidEmailData,
    shortPasswordData,
    missingFieldsData
};
