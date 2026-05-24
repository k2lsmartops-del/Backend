declare const _default: () => {
    port: number;
    frontendUrl: string;
    jwt: {
        secret: string | undefined;
        refreshSecret: string | undefined;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    cloudinary: {
        cloudName: string | undefined;
        apiKey: string | undefined;
        apiSecret: string | undefined;
    };
};
export default _default;
