// const express     = require('express');
// const bcrypt      = require('bcryptjs');
// const jwt         = require('jsonwebtoken');
// const uniqid      = require('uniqid');

// const User        = require('../models/user');
// const Device        = require('../models/device');

// const config      = require('../config');

// exports.dummy = (req, res) => {
//     let tarqeem = new User({ 
// 		id: '1',
//     	fullname: 'Tarqeem LIS', //faker.name.findName(), 
// 		username: 'tarqeem', //faker.name.firstName().toLocaleLowerCase(), 
//         password: 'asd', //faker.internet.password(), 
//         dummy: false,
//         admin: true,
//         enabled: true
// 	});

// 	bcrypt.genSalt(10, (err, salt) => {
//         bcrypt.hash(tarqeem.password, salt, (err, hash) => {
//             if ( err ) throw err;            
//             tarqeem.password = hash;
//             tarqeem.save(function(err) {
//                 if (err) throw err;
//                 console.log('dummy user saved successfully');
//                 res.json({ success: true });
//             });
//         });
// 	});
// };


// exports.update = (req, res) => {

//     let usr = req.body;
//     let id = req.params.id;

//     User.findOneAndUpdate({_id: id}, {
//         "devices": usr.devices,
//         "admin": usr.admin,
//         "enabled": usr.enabled,
//         "username": usr.username,
//         "fullname": usr.fullname,
        
//     }, (err, doc) => {
//         if (err) res.json({ success: false, data: err });
//         else res.json({ success: true, data: usr });

//         console.log(doc);
//     });
// }

// exports.register = (req, res) => {
//     let user = new User( req.body );
// 	bcrypt.genSalt(10, (err, salt) => {
//         user.password = 'asd';
//         bcrypt.hash(user.password, salt, (err, hash) => {
//             if ( err ) throw err;            
//             user.password = hash;
//             user.save(function(err) {
//                 if (err) throw err;
//                 console.log('user saved successfully');
//                 res.json({ success: true, user: user });
//             });
//         });
//     });
// };

// exports.updatePassword = (req, res) => {

//     let id = req.params.id;
//     let object = req.body;
    
//     User.findOne( { _id: id }).exec ( (err, user) => {

//         if ( err ) res.json({ success: false, error: "no user found" });
//         else {

//             bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
//                 if ( err ) res.json({ success: false, error: err });
//                 else  {

//                     bcrypt.genSalt(10, (err, salt) => {
//                         bcrypt.hash( object.newPassword, salt, (err, hash) => {
//                             if ( err ) res.json({ success: false, error: err });      
                            
//                             User.findOneAndUpdate({_id: id}, { "password": hash }, (err, user) => {
//                                 if (err) {
//                                     res.json({
//                                         success: false,
//                                         data: err
//                                     });
//                                 } else {
//                                     res.json({
//                                         success: true,
//                                         data: user
//                                     });
//                                 }
//                             });
                
//                         });
//                     });

                    
                    
//                 } 
//             });
            
//         }

    	
//     });
// };

// exports.reset = (req, res) => {

//     let id = req.params.id;

// 	bcrypt.genSalt(10, (err, salt) => {
//         let password = 'asd';
//         bcrypt.hash( password, salt, (err, hash) => {
//             if ( err ) throw err;            
            
//             User.findOneAndUpdate({_id: id}, { "password": hash }, (err, user) => {
//                 if (err) {
//                     res.json({
//                         success: false,
//                         data: err
//                     });
//                 } else {
//                     res.json({
//                         success: true,
//                         data: user
//                     });
//                 }
//             });

//         });
//     });
// };

// exports.authenticate0 = (req, res) => {
//     res.json({ success: false, user: req.body })
// }

// exports.users = (req, res) => {

//     User.find({}).exec ( (err, users) => {
// 		if ( err ) res.json({ success: false, data: err })
// 		else {
//             for ( let user of users ) user.password = '';

//             Device.find({}).exec ( (err, devices) => {
//                 if ( err ) res.json({ success: false, data: err })
//                 else {
                    
//                     res.json({ success: true, users: users, devices: devices });
                
//                 }
//             });

//         }
//     });
// }

// exports.authenticate = (req, res) => {

//     User.find({ username: 'tarqeem' }).exec ( (err, users) => {
// 		if ( users.length == 0 ) {
// 			let user = new User({
// 				"username" : "tarqeem",
// 				"fullname" : "System Developer Maintainance",
// 				"password" : "$2a$10$U4HH1M6v.OL/Fmv4U1hvLezp8DIRbrkVTIavdZBnU0JaESYJqlGOC",
// 				"admin" : true,
// 				"enabled" : true,
// 				"dummy": true
// 			});
// 			user.save( err => {
		
// 			})			
// 		}
//     })
    

//     User.findOne( { $or: [
//             { username: req.body.username }, 
//             { id: req.body.username } 
//         ]}
//         , function(err, user) {
// 		if (err) throw err;
// 		if (!user) {
// 			res.json({ success: false, message: 'Authentication failed. User not found.' });
// 		} else if (user) {
            
//             console.log(user);
            
// 			bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
                
//                 try {
//                     if (err) throw err;

//                     if ( !isMatch ) {
//                         res.json({ success: false, message: 'Authentication failed. Wrong password.' });
//                     } else {
//                         user.password = '';
//                         user.lastActiveSessionId = uniqid();

//                         User.findOneAndUpdate({ _id: user._id }, { lastActiveSessionId: user.lastActiveSessionId }, {upsert: true}, (err, usr) => {
//                             if (err) res.json({ success: false, data: err });

//                             const payload = {
//                                 user: user
//                             };
                            
//                             let token = jwt.sign(payload, config.secret, {
//                                 //expiresIn: 60*60*24 //24 hours
//                                 expiresIn: config.tokenExpiry
//                             });
//                             res.json({
//                                 success: true,
//                                 message: 'Login success',
//                                 user: user,
//                                 token: token
//                             });
                            
//                         })
//                     }
//                 } catch(ex) {
//                     res.json({ success: false, data: ex });
//                 }
//             });
// 		}
// 	});
// };

// exports.logout = (req, res) => {
//     res.json({ message: 'logout' });
// };

// exports.echo = (req, res) => {
//     res.json({ message: 'echo' })
// };