const multer = require('multer');

const users = [
  {
    gender: 1,
    groupId: 1,
    name: 'Mike',
    uesrId: 1
  },
  {
    gender: 2,
    groupId: 1,
    name: 'Amy',
    uesrId: 2
  },
  {
    gender: 1,
    groupId: 2,
    name: 'Jhon',
    uesrId: 3
  },
  {
    gender: 1,
    groupId: 1,
    name: 'Daniel',
    uesrId: 4
  },
  {
    gender: 1,
    groupId: 2,
    name: 'Lee',
    uesrId: 5
  }
];

const memStoage = multer.memoryStorage();
const upload = multer({ storage: memStoage });

module.exports = {
  '/abort/first-user': {
    get: {
      body: JSON.stringify(users[0]),
      status: 200,
      timeout: 1000
    }
  },
  '/basic/get': {
    get: {
      body: 'success',
      status: 200
    }
  },
  '/basic/groups/:groupId': {
    get: (req, res) => {
      const { param, query } = req;
      const data = users.filter(item => (
        param.groupId === item.groupId.toString() &&
        (
          query.name === undefined ||
          query.name === item.name
        )
      ));
      res.status(200).send(JSON.stringify(data));
    }
  },
  '/basic/json': {
    get: {
      body: JSON.stringify({
        message: 'success'
      }),
      status: 200
    }
  },
  '/fetch-plugin/server-time': {
    get: (req, res) => {
      setTimeout(() => {
        res
          .status(200)
          .send(Date.now().toString());
      }, 3000);
    }
  },
  '/file': {
    // download
    get: (req, res) => {
      const querySize = req.query.size;
      const reqSize = querySize ? parseInt(querySize, 10) : 0;
      // size in KB, default to 10M
      const size = (reqSize || 1024 * 10) * 1024;
      res
        .set('Content-Length', size.toString())
        .status(200)
        .send(Buffer.alloc(size));
    },
    post: (req, res) => {
      upload.single('file')(req, res, err => {
        if (err) {
          res.status(500).end();
        } else {
          const file = req.file;
          res
            .status(200)
            .send(JSON.stringify({
              filename: file.originalname,
              message: 'Upload success',
              size: file.size
            }));
        }
      });
    }
  },
  '/header': {
    get: (req, res) => {
      res
        .status(200)
        .send(JSON.stringify(req.rawHeaders));
    }
  },
  '/plugin/users/:userId': {
    get: (req, res) => {
      const params = req.params;
      const targetUser = users.find(
        item => item.uesrId.toString() === params.userId
      );
      const data = targetUser
        ? {
          data: targetUser,
          errCode: 0,
          message: 'success'
        }
        : {
          data: null,
          errCode: 4001,
          message: 'User not found'
        };
      res.status(200).send(JSON.stringify(data));
    }
  },
  /* eslint-disable-next-line sort-keys */
  '/*': () => ({
    body: {
      message: 'Not found'
    },
    status: 404
  })
};
