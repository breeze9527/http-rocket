const multer = require('multer');

const users = [
  {
    groupId: 1,
    uesrId: 1,
    name: 'Mike',
    gender: 1
  },
  {
    groupId: 1,
    uesrId: 2,
    name: 'Amy',
    gender: 2
  },
  {
    groupId: 2,
    uesrId: 3,
    name: 'Jhon',
    gender: 1
  },
  {
    groupId: 1,
    uesrId: 4,
    name: 'Daniel',
    gender: 1
  },
  {
    groupId: 2,
    uesrId: 5,
    name: 'Lee',
    gender: 1
  },
]

const memStoage = multer.memoryStorage();
const upload = multer({storage: memStoage});

module.exports = {
  '/basic/get': {
    get: {
      status: 200,
      body: 'success'
    },
  },
  '/basic/json': {
    get: {
      status: 200,
      body: JSON.stringify({
        message: 'success'
      })
    }
  },
  '/basic/groups/:groupId': {
    get: (req, res) => {
      const {param, query} = req;
      const data = users.filter(item => {
        return (
          param.groupId === item.groupId.toString()
        ) && (
          query.name === undefined ||
          query.name === item.name
        );
      });
      res.status(200).send(JSON.stringify(data));
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
          errCode: 0,
          message: 'success',
          data: targetUser
        }
        : {
          errCode: 4001,
          message: 'User not found',
          data: null
        };
      res.status(200).send(JSON.stringify(data));
    }
  },
  '/abort/first-user': {
    get: {
      timeout: 1000,
      status: 200,
      body: JSON.stringify(users[0])
    }
  },
  '/fetch-plugin/server-time': {
    get: (req, res) => {
      setTimeout(() => {
        res
          .status(200)
          .send(Date.now().toString())
      }, 3000);
    }
  },
  '/header': {
    get: (req, res) => {
      res
        .status(200)
        .send(JSON.stringify(req.rawHeaders));
    }
  },
  '/file': {
    // download
    get: (req, res) => {
      const reqSize = req.query.size;
      const size = (reqSize && parseInt(reqSize, 10) || 1024 * 10) * 1024; // size in KB, default to 10M
      res
        .set('Content-Length', size.toString())
        .status(200)
        .send(Buffer.alloc(size))
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
              message: 'Upload success',
              filename: file.originalname,
              size: file.size
            }));
        }
      });
    }
  },
  '/*': () => ({
    status: 404,
    body: {
      message: 'Not found'
    }
  })
}
