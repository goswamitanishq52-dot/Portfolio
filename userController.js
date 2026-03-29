import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { name, phone, address, avatar } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name: name || undefined,
                phone: phone || undefined,
                address: address || undefined,
                avatar: avatar || undefined,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addFavorite = async (req, res) => {
    try {
        const { productId } = req.body;

        const user = await User.findById(req.user.id);

        if (user.favorites.includes(productId)) {
            return res.status(400).json({ success: false, message: 'Product already in favorites' });
        }

        user.favorites.push(productId);
        await user.save();

        res.json({ success: true, message: 'Added to favorites', user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const removeFavorite = async (req, res) => {
    try {
        const { productId } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { favorites: productId } },
            { new: true }
        );

        res.json({ success: true, message: 'Removed from favorites', user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favorites');

        res.json({ success: true, count: user.favorites.length, favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
