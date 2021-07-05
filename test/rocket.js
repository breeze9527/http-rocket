var Rocket = rocket.Rocket;
var expect = chai.expect;

describe('Rocket', function () {
  describe('constructor', function () {
    it('accept option object', function () {
      var inst = new Rocket({
        method: 'GET',
        source: 'http://test.api.com'
      });
      expect(inst).to.be.an.instanceOf(Rocket);
    });

    it('accept shortcut', function () {
      var inst = new Rocket('GET', 'http://test.api.com');
      expect(inst).to.be.an.instanceOf(Rocket);
    });
  });
});
