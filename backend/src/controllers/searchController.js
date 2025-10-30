const User = require('../models/User');
const { ok } = require('../utils/response');

exports.searchMentors = async (req, res, next) => {
  try {
    const { q, expertise, rating, availability, page = 1, limit = 20 } = req.query;
    
    let filter = {
      role: 'Mentor',
      isMentorApproved: true,
      status: 'Active'
    };

    // Text search in name or bio
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ];
    }

    // Filter by expertise
    if (expertise) {
      filter['expertise.name'] = { $regex: expertise, $options: 'i' };
      filter['expertise.status'] = 'Approved';
    }

    // Filter by minimum rating
    if (rating) {
      filter.rating = { $gte: parseFloat(rating) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const mentors = await User.find(filter)
      .select('name bio avatarUrl expertise rating ratingsCount availability')
      .sort({ rating: -1, ratingsCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return ok(res, { 
      mentors, 
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMentorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const mentor = await User.findById(id)
      .select('name bio avatarUrl expertise rating ratingsCount availability')
      .where({ role: 'Mentor', isMentorApproved: true, status: 'Active' });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    return ok(res, { mentor });
  } catch (err) {
    next(err);
  }
};