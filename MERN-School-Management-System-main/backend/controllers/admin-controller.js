const asyncHandler = require('express-async-handler');
const Teacher = require('../models/teacherModel');
const Admin = require('../models/adminSchema');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/emailService');
const generatePassword = require('../utils/generatePassword');

const adminRegister = async (req, res) => {
    try {
        const admin = new Admin({
            ...req.body
        });

        const existingAdminByEmail = await Admin.findOne({ email: req.body.email });
        
        // Vérifier si schoolName est fourni avant de chercher
        let existingSchool = null;
        if (req.body.schoolName) {
            existingSchool = await Admin.findOne({ schoolName: req.body.schoolName });
        }

        if (existingAdminByEmail) {
            res.send({ message: 'Email already exists' });
        }
        else if (existingSchool) {
            res.send({ message: 'School name already exists' });
        }
        else {
            let result = await admin.save();
            result.password = undefined;
            res.send(result);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const adminLogIn = async (req, res) => {
    try {
        if (req.body.email && req.body.password) {
            let admin = await Admin.findOne({ email: req.body.email });
            if (admin) {
                // Utiliser la méthode matchPassword pour comparer les mots de passe hachés
                const isMatch = await admin.matchPassword(req.body.password);
                
                if (isMatch) {
                    // Ne pas envoyer le mot de passe dans la réponse
                    const adminData = {
                        _id: admin._id,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role,
                    };
                    
                    // Ajouter schoolName si présent
                    if (admin.schoolName) {
                        adminData.schoolName = admin.schoolName;
                    }
                    
                    res.send(adminData);
                } else {
                    res.send({ message: "Invalid password" });
                }
            } else {
                res.send({ message: "User not found" });
            }
        } else {
            res.send({ message: "Email and password are required" });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
};

const getAdminDetail = async (req, res) => {
    try {
        let admin = await Admin.findById(req.params.id);
        if (admin) {
            admin.password = undefined;
            res.send(admin);
        }
        else {
            res.send({ message: "No admin found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

const authAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
        res.json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            token: generateToken(admin._id, 'admin'),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const getTeacherRequests = asyncHandler(async (req, res) => {
    const status = req.query.status || 'pending';
    const teachers = await Teacher.find({ status }).select('-password');
    res.json(teachers);
});

const getTeacherById = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findById(req.params.id).select('-password');

    if (teacher) {
        res.json(teacher);
    } else {
        res.status(404);
        throw new Error('Teacher not found');
    }
});

const approveTeacher = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found');
    }

    const tempPassword = generatePassword(8);

    teacher.status = 'approved';
    teacher.password = tempPassword;
    teacher.isFirstLogin = true;

    await teacher.save();

    const message = `
      <h1>Teacher Registration Approved</h1>
      <p>Dear ${teacher.firstName} ${teacher.lastName},</p>
      <p>Your registration request has been approved.</p>
      <p>Please use the following temporary password to log in:</p>
      <p><strong>${tempPassword}</strong></p>
      <p>You will be required to change your password upon first login.</p>
      <p>Login URL: ${process.env.CLIENT_URL}/login</p>
      <p>Best regards,<br>Admin Team</p>
    `;

    try {
        await sendEmail({
            email: teacher.email,
            subject: 'Teacher Registration Approved',
            message,
        });

        res.json({ message: 'Teacher approved and email sent with temporary password' });
    } catch (error) {
        console.error(error);
        teacher.status = 'pending';
        await teacher.save();

        res.status(500);
        throw new Error('Error sending email, approval reverted');
    }
});

const rejectTeacher = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found');
    }

    teacher.status = 'rejected';
    teacher.rejectionReason = reason || 'No reason provided';

    await teacher.save();

    const message = `
      <h1>Teacher Registration Rejected</h1>
      <p>Dear ${teacher.firstName} ${teacher.lastName},</p>
      <p>We regret to inform you that your registration request has been rejected for the following reason:</p>
      <p>${teacher.rejectionReason}</p>
      <p>If you believe this is an error or want to provide additional information, please contact us.</p>
      <p>Best regards,<br>Admin Team</p>
    `;

    try {
        await sendEmail({
            email: teacher.email,
            subject: 'Teacher Registration Rejected',
            message,
        });

        res.json({ message: 'Teacher rejected and notification email sent' });
    } catch (error) {
        res.json({ message: 'Teacher rejected but failed to send notification email' });
    }
});

module.exports = {
    authAdmin,
    getTeacherRequests,
    getTeacherById,
    approveTeacher,
    rejectTeacher,
    adminRegister,
    adminLogIn,
    getAdminDetail,
};