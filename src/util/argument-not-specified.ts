const required = (v: string) => {
    throw new Error(`Argument "${v}" is required!`);
};

export default required;
