const assert = require('assert')
const expect = require('chai').expect

const mongoDbPath = process.env.MONGODB_TEST
if (!mongoDbPath) throw new Error(`MONGODB_TEST must be explicitly set to avoid overwriting production `)

const db = require('./db');

/** @todo Fix https://github.com/neuroanatomy/NeuroWebLab/issues/1 */
const usernameField = "username";
const usersCollection = "users";
const projectsCollection = "projects";
const annotationsCollection = "annotations";

db.init({
  MONGO_DB: mongoDbPath,
  overwriteMongoPath: null,
  callback: () => console.log("db callback"),
  usernameField,
  usersCollection,
  projectsCollection
});

// const garbageDb = require('./db');
// garbageDb.init({
//     MONGO_DB: 'GARBAGE_MONGO:27017/GARBAGE_MONGO',
//     overwriteMongoPath: null,
//     callback: () => console.log("garbageDb callback"),
//     usernameField,
//     usersCollection,
//     projectsCollection
// });

const dummyUser = {
    username: 'tommyjones',
    name: 'Tommy Jones',
    age: 14
};
const dummyUser2 = {
    username: 'jessicajones',
    name: 'Jessica Jones',
    age: 55
};
const dummyGithubUser1 = {
    username: 'github1username',
    name: 'github1 name',
    // nickname: 'github1 nickname',
    url: 'github1 url',
    brainboxURL: 'github1 brainbox URL',
    joined: 'github1 joined'
};
const dummyAnnotation = {
    fileID: 'dummy fileID 1',
    user: 'tommyjones', // "user" in annotation is "username" everywhere else
    annotation: JSON.stringify({
        annotationKey1: 'dummy annotation 1 annotation value 1',
        annotationkey2: 'dummy annotation 1 annotation value 2',
        Regions: ['dummy annotation 1 region1','dummy annotation 1 region2']
    }),
    Hash: 'abc123'
};
const expectedSavedDummy = [{
    fileID: 'dummy fileID 1',
    user: 'tommyjones', // "user" in annotation is "username" everywhere else
    annotation: 'dummy annotation 1 region2',
    Hash: 'abc123'
},{
    fileID: 'dummy fileID 1',
    user: 'tommyjones',
    annotation: 'dummy annotation 1 region1',
    Hash: 'abc123'
}];
const dummyAnnotation_updated = {
    fileID: 'dummy fileID 1',
    user: 'tommyjones', // "user" in annotation is "username" everywhere else
    annotation: JSON.stringify({
        annotationKey1: 'dummy annotation 1 annotation value 1 updated',
        annotationkey2: 'dummy annotation 1 annotation value 2 updated',
        Regions: ['dummy annotation 1 updated region1','dummy annotation 1 updated region2']
    }),
    Hash: 'abc123 updated'
};
const expectedSavedDummyUpdated = [{
    fileID: 'dummy fileID 1',
    user: 'tommyjones',
    annotation: 'dummy annotation 1 updated region2',
    Hash: 'abc123 updated'
},{
    fileID: 'dummy fileID 1',
    user: 'tommyjones',
    annotation: 'dummy annotation 1 updated region1',
    Hash: 'abc123 updated'
}];
const dummyAnnotation2 = {
    fileID: 'dummy fileID 2',
    user: 'anyone',
    annotation: JSON.stringify({
        annotationKey1: 'dummy annotation 2 annotation value 1',
        annotationkey2: 'dummy annotation 2 annotation value 2',
        Regions: ['dummy annotation 2 region1','dummy annotation 2 region2']
    }),
    Hash: '123abc'
};
const expectedSavedDummy2 = [{
    fileID: 'dummy fileID 2',
    user: 'anyone',
    annotation: 'dummy annotation 2 region1',
    Hash: '123abc'
},{
    fileID: 'dummy fileID 2',
    user: 'anyone',
    annotation: 'dummy annotation 2 region2',
    Hash: '123abc'
}];

describe('Mocha Started',() => {
    it('Mocha works properly',()=>{
        assert.equal(1,1)
    })
});

describe('testing db.js',() => {
    before(() => {
        db.mongoDB()._db.dropDatabase()
    });

    after(() => db.mongoDB()._db.dropDatabase()
            .then(() => db.mongoDB().close()));

    it('should show db is in good health', () => {
        expect(db.checkHealth()).to.be.equal(true);
    });

    // it('should show garbage db is in bab health', () => {
    //     expect(garbageDb.checkHealth()).to.be.equal(false)
    // });

    // describe('db operation with bad db health should result in error', () => {
    //     const getTestGarbageDb = ({ prop, arg }) => (done) => (garbageDb[prop](arg)
    //         .then(() => done('should not succeed'))
    //         .catch(e => done()), null)
    //     /**
    //      * somewhat necessary to return NOT a promise. or else mocha will complain
    //      */

    //     /**
    //      * user management
    //      */
    //     it('addUser throws', getTestGarbageDb({prop: 'addUser', arg: dummyUser}))
    //     it('queryUser throws', getTestGarbageDb({prop: 'queryUser', arg: dummyUser}))
    //     it('queryAllUsers throws', getTestGarbageDb({prop: 'queryAllUsers', arg: dummyUser}))
    //     it('updateUser throws', getTestGarbageDb({prop: 'updateUser', arg: dummyUser}))
    //     it('upsertUser throws', getTestGarbageDb({prop: 'upsertUser', arg: dummyUser}))

    //     /**
    //      * annotation managedment
    //      */

    //     it('findAnnotations throws', getTestGarbageDb({prop: 'findAnnotations', arg: dummyAnnotation}))
    //     it('updateAnnotation throws', getTestGarbageDb({prop: 'updateAnnotation', arg: dummyAnnotation}))
        
    // });

    it('querying the empty mongodb should not yield any results',(done)=>{
        db.queryUser({
            username: dummyUser.username
        }).then(() => {
            done('should have been empty, but not really empty');
        }).catch((err) => {
            expect(err.message).to.equal('error find one user');
            done();
        });
    });

    describe('testing adding and querying users',()=>{

        it('adding user works fine',(done)=>{
            db.addUser(dummyUser)
                .then((returnedUser)=>{
                    expect(returnedUser).to.equal(dummyUser)
                    done()
                })
                .catch(e=>done(e))
        })
        it('adding an additional user works fine',(done)=>{
            db.addUser(dummyUser2)
                .then((returnedUser)=>{
                    expect(returnedUser).to.equal(dummyUser2)
                    done()
                })
                .catch(e=>done(e))
        })
    
        it('querying the inserted users should work as expected',(done)=>{
            Promise.all([
                db.queryUser({
                    username: dummyUser.username
                }),
                db.queryUser({
                    username: dummyUser2.username
                })
            ]).then(users=>{
                expect(users).to.deep.equal([
                    dummyUser,
                    dummyUser2
                ])
                done()
            }).catch(e=>done(e))
        })
    });

    describe('testing adding and querying github users', () => {
        it('should add user fine', (done) => {
            db.addUser(dummyGithubUser1)
                .then(user => {
                    expect(user).to.deep.equal(dummyGithubUser1)
                    done()
                })
                .catch(done)
        })

        it('querying the inserted user should work as intended', (done) => {
            db.queryUser({
                username: dummyGithubUser1.username
            })
                .then(user => {
                    expect(user).to.deep.equal(dummyGithubUser1)
                    done()
                })
                .catch(done)
        });

        it('update user should work', (done) => {

            const dghu1c = {
                ...dummyGithubUser1,
                joined: 'joined2'
            }
            db.updateUser(dghu1c)
                .then(user => {
                    expect(user).to.deep.equal(dghu1c)
                    done()
                })
                .catch(done)
        });

        it('upsert user should work', (done) => {

            const dghu1c = {
                ...dummyGithubUser1,
                joined: 'joined3'
            };

            const githubUser2 = {
                ...dummyGithubUser1,
                username: 'github1 username alt'
            };

            Promise.all([
                db.upsertUser(dghu1c),
                db.updateUser(githubUser2)
            ])
                .then(users => {
                    expect(users).to.deep.equal([
                        dghu1c,
                        githubUser2
                    ])
                    done()
                })
                .catch(done)
        });
    });

    // describe('testing adding, and querying annotations',()=>{

    //     it('should add annotations fine',(done)=>{
    //         db.updateAnnotation(dummyAnnotation)
    //             .then(()=>done())
    //             .catch(done)
    //     })

    //     it('should query the added annotation fine',(done)=>{
    //         const { fileID } = dummyAnnotation
    //         db.findAnnotations({
    //             fileID 
    //         })
    //             .then(annotations=>{
    //                 annotations.forEach(anno=>{
    //                     const { user, fileID, Hash, annotation } = anno
    //                     expect(expectedSavedDummy).to.deep.include.members([{ user, fileID, Hash, annotation }])
    //                 })
    //                 done()
    //             })
    //             .catch(done)

    //     })

    //     it('should add another annotations fine',(done)=>{
    //         db.updateAnnotation(dummyAnnotation2)
    //             .then(()=>done())
    //             .catch(done)
    //     })

    //     it('should query the added annotation fine',(done)=>{
    //         const { fileID } = dummyAnnotation2
    //         db.findAnnotations({
    //             fileID 
    //         })
    //             .then(annotations=>{
    //                 annotations.forEach(anno=>{
    //                     const { user, fileID, Hash, annotation } = anno
    //                     expect(expectedSavedDummy2).to.deep.include.members([{ user, fileID, Hash, annotation }])
    //                 })
    //                 done()
    //             })
    //             .catch(done)

    //     })



    //     it('should update fine',(done)=>{
    //         db.updateAnnotation(dummyAnnotation_updated)
    //             .then(()=>done())
    //             .catch(done)
    //     })

    //     it('should fetch the updated annotation',(done)=>{
            
    //         const { fileID } = dummyAnnotation_updated
    //         db.findAnnotations({
    //             fileID
    //         })
    //             .then(annotations=>{
    //                 annotations.forEach(anno=>{
    //                     const { user, fileID, Hash, annotation } = anno
    //                     expect(expectedSavedDummyUpdated).to.deep.include.members([{ user, fileID, Hash, annotation }])
    //                 })
    //                 done()
    //             })
    //             .catch(done)
    //     })
        
    //     it('should fetch an empty array when no results could be found',(done)=>{
    //         db.findAnnotations({
    //             fileID: 'clearly a non-existent fileid'
    //         }).then(annotations=>{
    //             expect(annotations).to.be.deep.equal([])
    //             done()
    //         }).catch(done)
    //     })
        
    // });
})
