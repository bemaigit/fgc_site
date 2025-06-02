import { PaymentGateway } from "../types"
import { InfinitePayCredentials } from "../types"

export class InfinitePayGateway implements PaymentGateway {
  constructor(private credentials: InfinitePayCredentials) {}

  // Implementar métodos do gateway
}
