export const errorMessage = {
    badPayload: 'Alguno de los campos obligatorios no esta presente',
    userAlreadyExist: 'El usuario ya ha sido registrado',
    internalServer: 'Error interno del servidor',
    badCredentials: 'Las credenciales son incorrectas',
    userNotFound: 'Usuario no encontrado',
    forbbiden: 'No tiene permisos para realizar esta acción',
    productNotFound: 'Producto no encontrado',
    invalidQuantity: 'La cantidad ingresada no es valida'
}

export const logsMessage = {
    ErrorInLambda(lambda: string){ return `Error en la lambda ${lambda}`;}
}