const helloWorld = (): string => {
    return 'Hello World!';
};

it('should return Hello World!', function () {
    expect(helloWorld()).toBe("Hello World!");
});
