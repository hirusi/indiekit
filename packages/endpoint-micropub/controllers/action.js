import httpError from 'http-errors';
import {formEncodedToMf2, normaliseMf2} from '../lib/microformats.js';
import {post} from '../lib/post.js';
import {postData} from '../lib/post/data.js';
import {checkScope} from '../lib/scope.js';
import {uploadMedia} from '../lib/media.js';

export const actionController = publication => {
  /**
   * Perform requested post action
   *
   * @param {object} request HTTP request
   * @param {object} response HTTP response
   * @param {Function} next Next middleware callback
   * @returns {object} HTTP response
   */
  return async (request, response, next) => {
    const {body, files, query} = request;
    const action = query.action || body.action || 'create';
    const url = query.url || body.url;
    const {scope} = publication.accessToken;

    try {
      checkScope(scope, action);

      // Create and normalise Microformats2 data
      // TODO: Attached photos don’t appear with correct alt text
      let mf2 = request.is('json') ? body : formEncodedToMf2(body);
      mf2 = files ? await uploadMedia(publication, mf2, files) : mf2;
      mf2 = normaliseMf2(mf2);

      let data;
      let published;
      switch (action) {
        case 'create':
          data = await postData.create(publication, mf2);
          published = await post.create(publication, data);
          break;
        case 'update':
          data = await postData.update(publication, url, body);
          published = await post.update(publication, data, url);
          break;
        case 'delete':
          data = await postData.read(publication, url);
          published = await post.delete(publication, data);
          break;
        case 'undelete':
          data = await postData.read(publication, url);
          published = await post.undelete(publication, data);
          break;
        default:
      }

      return response.status(published.status).location(published.location).json(published.json);
    } catch (error) {
      // TODO: Remove this temporary fix
      const status = error.status || 400;
      next(httpError(status, error.message, {
        json: {
          error: 'invalid_request',
          error_description: error.message,
          scope: error.scope
        }
      }));
    }
  };
};
