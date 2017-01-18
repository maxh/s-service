import * as middleware from './middleware';


let savedNodeEnv = null;

beforeEach(() => {
  savedNodeEnv = process.env.NODE_ENV;
});

afterEach(() => {
  process.env.NODE_ENV = savedNodeEnv;
});


test('https forced in production', () => {
  process.env.NODE_ENV = 'production';

  const mockReq = {
    url: '/foo',
    header: (name) => {
      if (name === 'x-forwarded-proto') {
        return 'http';
      } else if (name === 'host') {
        return 'bar.com';
      }
    },
  };

  let redirectedToPath = null;
  const mockRes = {
    redirect: (path) {
      redirectedToPath = path;
    }
  };

  let wasNextCalled = false;
  const mockNext = () {
    wasNextCalled = true;
  }

  middleware.forceHttpsUnlessDev(mockReq, mockRes, mockNext);
  expect(redirectedToPath).toBe('https://bar.com/foo');
  expect(wasNextCalled).toBe(false);
});
