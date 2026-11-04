export const errorMessage = {
    badPayload: 'Alguno de los campos obligatorios no esta presente',
    userAlreadyExist: 'El usuario ya ha sido registrado',
    internalServer: 'Error interno del servidor',
    badCredentials: 'Las credenciales son incorrectas'
}

export const logsMessage = {
    ErrorInLambda(lambda: string){ return `Error en la lambda ${lambda}`;}
}