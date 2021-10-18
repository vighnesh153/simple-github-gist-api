import {AxiosRequestConfig} from "axios";

interface AuthConfigProps {
  personalAccessToken: string;
}

const getAuthConfig = (props: AuthConfigProps): AxiosRequestConfig => {
  return {
    headers: {Authorization: `token ${props.personalAccessToken}`}
  };
};

export default getAuthConfig;
