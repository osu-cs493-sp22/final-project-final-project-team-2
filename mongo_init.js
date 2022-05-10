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
);