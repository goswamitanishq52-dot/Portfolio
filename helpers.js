import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

export const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    // Set httpOnly cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res
        .status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
};

export const validateEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

export const generateOrderNumber = () => {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

export const calculateTax = (amount, taxRate = 0.08) => {
    return parseFloat((amount * taxRate).toFixed(2));
};

export const calculateDiscount = (amount, discountPercent) => {
    return parseFloat((amount * (discountPercent / 100)).toFixed(2));
};
