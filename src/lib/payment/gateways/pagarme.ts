import { PaymentGateway } from "../types"
import { PagarMeCredentials } from "../types"

export class PagarMeGateway implements PaymentGateway {
  constructor(private credentials: PagarMeCredentials) {}

  // Implementar métodos do gateway
}
