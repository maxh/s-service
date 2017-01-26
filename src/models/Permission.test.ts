import * as mongoose from 'mongoose';

import Permission, { Provider } from './Permission';


// Use native Promises instead of mpromise, mongoose's default.
(mongoose as any).Promise = global.Promise;


describe('Permission', () => {

  beforeEach(() => {
    jest.resetModules();
  });

  test('google provider info creates proper permission', () => {
    const findOneMock = jest.fn();
    findOneMock.mockReturnValueOnce(Promise.resolve(null));
    Permission.modelsByProvider[Provider.GOOGLE].findOne = findOneMock;

    const createMock = jest.fn(params => Promise.resolve(params));
    Permission.modelsByProvider[Provider.GOOGLE].create = createMock;

    const providerInfo = {
      scopes: ['foo scope'],
      accessToken: 'foo access token',
      accessTokenExpiration: 12345,
      refreshToken: 'foo refresh token',
      googleId: 'foo google id',
    };

    return Permission.createOrUpgrade('foo', Provider.GOOGLE, providerInfo)
        .then(permission => {
          expect(permission.providerInfo.scopes).toEqual(['foo scope']);
          expect(permission.providerInfo.accessToken).toBe('foo access token');
          expect(permission.providerInfo.accessTokenExpiration).toBe(12345);
          expect(permission.providerInfo.refreshToken).toBe('foo refresh token');
          expect(permission.providerInfo.googleId).toBe('foo google id');
        });
  });
});
