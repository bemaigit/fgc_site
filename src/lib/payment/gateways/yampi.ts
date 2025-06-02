import { PaymentGateway } from "../types"
import { YampiCredentials } from "../types"

export class YampiGateway implements PaymentGateway {
  constructor(private credentials: YampiCredentials) {}

  // Implementar métodos do gateway
}
