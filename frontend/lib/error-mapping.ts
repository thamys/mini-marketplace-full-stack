/**
 * Maps backend error messages (standardized to English) to localized Portuguese strings
 * for the end user.
 */
export const mapErrorMessage = (message: string): string => {
  const mapping: Record<string, string> = {
    'Email already registered': 'Este e-mail já está cadastrado.',
    'Invalid credentials': 'E-mail ou senha incorretos.',
    'User not found': 'Usuário não encontrado.',
    'Password is too weak': 'A senha é muito fraca.',
    'Token expired': 'Sua sessão expirou. Por favor, entre novamente.',
    'Invalid token': 'Sessão inválida. Por favor, entre novamente.',
    'Token not provided': 'Você precisa estar logado.',
    'Internal Server Error': 'Ocorreu um erro interno. Tente novamente mais tarde.',
  };

  return mapping[message] || message;
};
