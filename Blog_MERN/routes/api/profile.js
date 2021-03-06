
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load Validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');


const profileModel = require('../../models/Profile');
const userModel = require('../../models/User');

const authCheck = passport.authenticate('jwt', { session: false });



// @route   GET api/profile/test
// @desc    Tests users route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Profile Works' }));


// @route   GET api/profile
// @desc    Get current users profile
// @access  Private
router.get('/', authCheck, (req, res) => {

    const errors = {};

    profileModel.findOne({ user: req.user.id })
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'There is no profile for this user';
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.json(err));

});


// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public
router.get('/all', (req, res) => {

    const errors = {};
    profileModel.find()
        .populate('user', ['name', 'avatar'])
        .then(profiles => {
            if (!profiles) {
                errors.noprofile = 'There are no profiles';
                return res.status(404).json(errors);
            }
            res.json(profiles);
        })
        .catch(err => res.status(404).json({
            profile: 'There are no profiles'
        }));
});

// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public
router.get('/handle/:handle', (req, res) => {

    const errors = {};
    profileModel.findOne({ handle: req.params.handle })
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'There is no profile for this user';
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json(errors));
});


// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', (req, res) => {
   const errors = {};

   profileModel.findOne({ user: req.params.user_id })
       .populate('user', ['name', 'avatar'])
       .then(profile => {
           if (!profile) {
              errors.noprofile = 'There is no profile for this user';
              return res.status(404).json(errors);
           }
           res.json(profile);
       })
       .catch(err => res.status(404).json({
           profile: 'There is no profile for this user'
       }));
});




// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post('/', authCheck, (req, res) => {

    const { errors, isValid } = validateProfileInput(req.body);

    // check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername) profileFields.githubusername = req.body.githubusername;

    // Skills - Spilt into array
    if (typeof req.body.skills !== 'undefined') {
        profileFields.skills = req.body.skills.split(',');
    }

    // Social
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    profileModel.findOne({ user: req.user.id })
        .then(profile => {
            if (profile) {
                // update
                profileModel
                    .findOneAndUpdate(
                        { user: req.user.id },
                        { $set: profileFields },
                        { new: true }
                    )
                    .then(profile => res.json(profile))
                    .catch(err => res.json(err));
            } else {
                // check if handle exists
                profileModel
                    .findOne({ handle: profileFields.handle })
                    .then(profile => {
                        if (profile) {
                            errors.handle = 'That handle already exists';
                            res.status(400).json(errors);
                        }
                        new profileModel(profileFields)
                            .save()
                            .then(profile => res.json(profile))
                            .catch(err => res.json(err));
                    })
                    .catch(err => res.json(err));
            }
        })
        .catch(err => res.json(err));
});

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private

router.get('/experience', authCheck, (req, res) => {

    const { errors, isValid } = validateExperienceInput(req.body);

    // check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    profileModel.findOne({ user: req.user.id })
        .then(profile => {
            const newExp = {
                title: req.body.title,
                company: req.body.company,
                location: req.body.location,
                from: req.body.from,
                to: req.body.to,
                current: req.body.current,
                description: req.body.description
            };

            // add to exp array
            profileModel.experience.unshift(newExp);
            profileModel
                .save()
                .then(profile => res.json(profile))
                .catch(err => res.status(404).josn(err));
        })
        .catch(err => res.status(404).json(err));
});

// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private
router.post('/education', authCheck, (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            const newEdu = {
                school: req.body.school,
                degree: req.body.degree,
                fieldofstudy: req.body.fieldofstudy,
                from: req.body.from,
                to: req.body.to,
                current: req.body.current,
                description: req.body.description
            };

            // Add to exp array
            profile.education.unshift(newEdu);
            profile
                .save()
                .then(profile => res.json(profile))
                .catch(err => res.status(404).json(err));
        })
        .catch(err => res.status(404).json(err));

});

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private

router.delete('/experience/:exp_id', authCheck, (req, res) => {
   profileModel.findOne({ user: req.user.id })
       .then(profile=> {

           //get remove index
           const removeIndex = profile.experience
               .map(item => item.id)
               .indexOf(req.params.exp_id);

           // splice out of array
           profile.experience.splice(removeIndex, 1);
           // save
           profile.save()
               .then(profile => res.json(profile))
               .catch(err => res.status(404).json(err));
       })
       .catch(err => res.status(404).json(err));
});


// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', authCheck, (req, res) => {
    profileModel.findOne({ user: req.user.id })
        .then(profile=> {

            //get remove index
            const removeIndex = profile.education
                .map(item => item.id)
                .indexOf(req.params.edu_id);

            // splice out of array
            profile.education.splice(removeIndex, 1);
            // save
            profile.save()
                .then(profile => res.json(profile))
                .catch(err => res.status(404).json(err));
        })
        .catch(err => res.status(404).json(err));
});

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private
router.delete('/', authCheck, (req, res) => {
   profileModel.findByIdAndRemove({ user: req.user.id })
       .then(() => {
           userModel.findOneAndRemove({ _id: req.user.id})
               .then(() => res.json({ success: true }))
               .catch(err => res.status(404).json(err));
       })
       .catch(err => res.status(404).json(err));
});




module.exports = router;