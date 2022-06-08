db = db.getSiblingDB('tarpaulin');

db.createUser(
    {
        user: "db-manager",
        pwd: "hunter2",
        roles: [
            {
                role: "readWrite",
                db: "tarpaulin"
            }
        ]
    }
)

db.users.insertOne({
    "name": "Brandon",
    "email": "admin@tarpaulin.com",
    "password": "$2a$08$CmzlPhVvHw6fG5FKNF1.G.CvgM1Vz8pCsBZAGtH4aOvVmwlAFfLpi",
    "role": "admin",
})