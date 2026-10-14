const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const Admin = require("../models/Admin");

const keys = require("./key");

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = keys.secretOrKey;

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const faculty = await Faculty.findById(jwt_payload.id);
        if (faculty) {
          return done(null, { ...faculty.toObject(), role: "faculty" });
        }

        const student = await Student.findById(jwt_payload.id);
        if (student) {
          return done(null, { ...student.toObject(), role: "student" });
        }

        const admin = await Admin.findById(jwt_payload.id);
        if (admin) {
          return done(null, { ...admin.toObject(), role: "admin" });
        }

        return done(null, false, { message: "User not found" });
      } catch (err) {
        return done(err, false);
      }
    })
  );
};
