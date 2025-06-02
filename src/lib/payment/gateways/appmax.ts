import { PaymentGateway } from "../types"
import { AppmaxCredentials } from "../types"

export class AppmaxGateway implements PaymentGateway {
  constructor(private credentials: AppmaxCredentials) {}

  // Implementar métodos do gateway
}
