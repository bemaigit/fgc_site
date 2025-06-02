import { PaymentGateway } from "../types"
import { GetnetCredentials } from "../types"

export class GetnetGateway implements PaymentGateway {
  constructor(private credentials: GetnetCredentials) {}

  // Implementar métodos do gateway
}
