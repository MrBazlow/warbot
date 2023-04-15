import Axios from 'axios'
import { setupCache } from 'axios-cache-interceptor'

const axios = setupCache(Axios)

export default async function fetchJSON(url: string): Promise<unknown> {
  return await axios({ url, timeout: 5_000 })
    .then((value) => value.data as unknown)
    .catch(console.error)
}
