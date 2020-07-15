import constants  from '../constants';

const formattedGistIdentifier = (identifierName: string): string => {
    const { prefix, suffix } = constants.identifier;
    return prefix + identifierName + suffix;
};

export default formattedGistIdentifier;
