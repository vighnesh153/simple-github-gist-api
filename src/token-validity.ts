import constants  from './constants';
import { default as axios } from 'axios';

const isTokenStringValid = async (token: string): Promise<boolean> => {
    const rateLimitEndpoint = constants.githubRateLimit;
    return axios
        .get(rateLimitEndpoint, {
            headers: {Authorization: `token ${token}`}
        })
        .then(result => result.headers['x-oauth-scopes'].includes('gist'));
};

// check if token is valid and has gist access
const validateToken = async (token: string): Promise<void> => {
    if (!(await isTokenStringValid(token))) {
        throw new Error('Token is invalid or it doesn\'t have gist access.')
    }
}

export default validateToken;
