/**
 * @jest-environment jsdom
 */

import 'core-js';
import 'jest';
import '@testing-library/jest-dom';

import * as React from 'react';

import portfinder from 'portfinder';
import { Server } from 'socket.io';
import { io as client } from 'socket.io-client';

import {
    render,
    screen,
    waitFor,
} from '@testing-library/react';

import useSocket from '../dist/index.js';

// import { expect } from "jest";

describe("Basic Test:", () => {
    test("TestCase1", done => {
        const TestCase1 = () => {
            const uri = "ws://host:port";
            const [socket] = useSocket(uri, {
                autoConnect: false
            });
            expect(socket.io.uri).toEqual(uri);
            expect(socket.io.opts.autoConnect).toEqual(false);

            const uri2 = "wss://host:port";
            const [socket2] = useSocket(uri2, {
                autoConnect: false
            });
            expect(socket.io.uri).toEqual(uri);
            expect(socket2.io.uri).toEqual(uri2);

            return null;
        };

        render(<TestCase1 />);

        done();
    });
});

describe("Hook Test:", () => {
    test("TestCase2", done => {
        let socket;
        const TestCase2 = () => {
            [socket] = useSocket("ws://host:port", {
                autoConnect: false
            });
            socket.on("testcase2", null);
            return null;
        };
        const testRenderer = render(<TestCase2 />);
        expect(typeof socket._callbacks["$testcase2"] !== "undefined").toEqual(true);
        testRenderer.unmount();
        expect(typeof socket._callbacks["$testcase2"] !== "undefined").toEqual(false);

        done();
    });
});

describe("Real-world Test:", () => {
    let port = 3000;
    let io = null;

    beforeAll(async () => {
        port = await portfinder.getPortPromise();
        io = new Server(port);
    });

    afterAll(() => {
        io.close();
    });

    test("Server is responding", (done) => {
        // Sanity check; if this fails, the remaining tests are expected to fail
        const socket = client(`ws://localhost:${port}`);
        socket.on('error', (error) => {
            console.error(error.message)
            expect(socket.connected).toEqual(true);
            done();
        })
        socket.on('connect', () => {
            console.log('connected');
            expect(socket.connected).toEqual(true);
            done();
        })
    })

    test("Check connection updates", async () => {
        const ConnectionStatus = () => {
            const [, connected] = useSocket(`ws://localhost:${port}`);
            return <div role='connectionStatus'>Connected: {connected.toString()}</div>
        }

        const testRenderer = render(<ConnectionStatus />);

        expect(screen.getByRole('connectionStatus')).toHaveTextContent('Connected: false')
        await waitFor(() => expect(screen.getByRole('connectionStatus')).toHaveTextContent('Connected: true'));
        testRenderer.unmount();
    });

    test("Check transport updates", async () => {
        const TransportName = () => {
            const [, , transport] = useSocket(`ws://localhost:${port}`);
            return <div role='transportName'>Transport: {transport}</div>
        }

        const testRenderer = render(<TransportName />);

        expect(screen.getByRole('transportName')).toHaveTextContent(/^Transport: polling$/);
        await waitFor(
            // () => expect(screen.getByRole('transportName')).toHaveTextContent('Transport: websocket'),
            () => {
                console.log("got: " + (testRenderer.container.firstChild?.textContent ?? 'no content'));
                expect(screen.getByRole('transportName')).toHaveTextContent(/^Transport: websocket$/)
            },
            { timeout: 5000 }
        );
        testRenderer.unmount();
    }, 10000);
})